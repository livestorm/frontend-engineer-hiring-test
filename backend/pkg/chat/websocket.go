package chat

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 2048 // 2KB - enough for 500 char message + JSON overhead
	maxClients     = 50
	maxMsgPerMin   = 20
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // I know this is not secure, but this is just for development.
	},
	HandshakeTimeout: 10 * time.Second,
}

type Client struct {
	conn        *websocket.Conn
	send        chan WSMessage
	hub         *Hub
	userID      string
	msgCount    int
	lastReset   time.Time
	rateLimitMu sync.Mutex
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan WSMessage
	register   chan *Client
	unregister chan *Client
	store      *Store
	mu         sync.RWMutex
}

type WSMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type SendMessageRequest struct {
	Text       string `json:"text"`
	AuthorName string `json:"author_name"`
}

type AddReactionRequest struct {
	MessageID string `json:"message_id"`
	Emoji     string `json:"emoji"`
}

func NewHub(store *Store) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan WSMessage, 256),
		register:   make(chan *Client, 10),
		unregister: make(chan *Client, 10),
		store:      store,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("webSocket client connected: %s", client.userID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("webSocket client disconnected: %s", client.userID)

		case message := <-h.broadcast:
			h.mu.RLock()
			var failedClients []*Client
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					failedClients = append(failedClients, client)
				}
			}
			h.mu.RUnlock()

			if len(failedClients) > 0 {
				h.mu.Lock()
				for _, client := range failedClients {
					if _, ok := h.clients[client]; ok {
						delete(h.clients, client)
						close(client.send)
					}
				}
				h.mu.Unlock()
			}
		}
	}
}

func (h *Hub) BroadcastMessage(msgType string, data any) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		log.Printf("failed to marshal broadcast data: %v", err)
		return
	}

	wsMsg := WSMessage{
		Type: msgType,
		Data: dataBytes,
	}
	h.broadcast <- wsMsg
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var wsMsg WSMessage
		err := c.conn.ReadJSON(&wsMsg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("webSocket error: %v", err)
			}
			break
		}

		c.handleMessage(wsMsg)
	}
}

func (c *Client) checkRateLimit() bool {
	c.rateLimitMu.Lock()
	defer c.rateLimitMu.Unlock()

	now := time.Now()
	if now.Sub(c.lastReset) > time.Minute {
		c.msgCount = 0
		c.lastReset = now
	}

	if c.msgCount >= maxMsgPerMin {
		return false
	}

	c.msgCount++
	return true
}

func (c *Client) handleMessage(wsMsg WSMessage) {
	switch wsMsg.Type {
	case "send_message":
		c.handleSendMessage(wsMsg.Data)
	case "add_reaction":
		c.handleAddReaction(wsMsg.Data)
	default:
		log.Printf("Unknown message type: %s from %s", wsMsg.Type, c.userID)
	}
}

func (c *Client) sendError(errorMsg string) {
	errData, _ := json.Marshal(map[string]string{"error": errorMsg})
	c.send <- WSMessage{
		Type: "error",
		Data: errData,
	}
}

func (c *Client) handleSendMessage(data json.RawMessage) {
	if !c.checkRateLimit() {
		log.Printf("rate limit exceeded for %s", c.userID)
		c.sendError("Rate limit exceeded. Maximum 60 messages per minute.")
		return
	}

	var msgReq SendMessageRequest
	if err := json.Unmarshal(data, &msgReq); err != nil {
		log.Printf("failed to parse send_message: %v", err)
		c.sendError("Invalid message format")
		return
	}

	msg, err := NewMessage(msgReq.Text, msgReq.AuthorName, c.userID)
	if err != nil {
		log.Printf("failed to create message: %v", err)
		c.sendError(err.Error())
		return
	}

	c.hub.store.Add(*msg)
	log.Printf("message sent via webSocket from %s", c.userID)
}

func (c *Client) handleAddReaction(data json.RawMessage) {
	var reactionReq AddReactionRequest
	if err := json.Unmarshal(data, &reactionReq); err != nil {
		log.Printf("failed to parse add_reaction: %v", err)
		return
	}

	// Toggle reaction
	if err := c.hub.store.ToggleReaction(reactionReq.MessageID, reactionReq.Emoji, c.userID); err != nil {
		log.Printf("failed to toggle reaction: %v", err)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				log.Printf("webSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// check max connections before upgrading
	h.hub.mu.RLock()
	clientCount := len(h.hub.clients)
	h.hub.mu.RUnlock()

	if clientCount >= maxClients {
		http.Error(w, "too many connections", http.StatusServiceUnavailable)
		log.Printf("rejected connection: max clients reached (%d)", maxClients)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("webSocket upgrade error: %v", err)
		return
	}

	clientIP := r.RemoteAddr
	userID := h.store.GetUserID(clientIP)

	client := &Client{
		conn:      conn,
		send:      make(chan WSMessage, 256),
		hub:       h.hub,
		userID:    userID,
		lastReset: time.Now(),
	}

	client.hub.register <- client

	// send all existing messages to the new client
	messages := h.store.GetAll()
	for _, msg := range messages {
		msgBytes, err := json.Marshal(msg)
		if err != nil {
			log.Printf("failed to marshal message: %v", err)
			continue
		}
		wsMsg := WSMessage{
			Type: "message",
			Data: msgBytes,
		}
		client.send <- wsMsg
	}

	// start goroutines for reading and writing
	go client.readPump()
	go client.writePump()
}
