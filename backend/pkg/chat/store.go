package chat

import (
	"fmt"
	"log"
	"sync"
)

const maxMessages = 1000

type Store struct {
	messages []Message
	sessions map[string]string
	hub      *Hub
	mu       sync.RWMutex
}

func NewStore(hub *Hub) *Store {
	return &Store{
		messages: make([]Message, 0),
		sessions: make(map[string]string),
		hub:      hub,
	}
}

func (s *Store) SetHub(hub *Hub) {
	s.hub = hub
}

func (s *Store) Add(msg Message) {
	s.mu.Lock()
	s.messages = append(s.messages, msg)

	// Keep only last maxMessages to prevent infinite memory growth
	if len(s.messages) > maxMessages {
		s.messages = s.messages[len(s.messages)-maxMessages:]
	}
	s.mu.Unlock()

	log.Printf("new message [%s]: %q from %s", msg.ID[:8], msg.Text, msg.AuthorName)
	s.hub.BroadcastMessage("message", msg)
}

func (s *Store) GetAll() []Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Message, len(s.messages))
	copy(result, s.messages)
	return result
}

func (s *Store) GetSince(timestamp int64) []Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Message
	for _, msg := range s.messages {
		if msg.CreatedAt > timestamp {
			result = append(result, msg)
		}
	}
	return result
}

func (s *Store) ToggleReaction(messageID, emoji, userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.messages {
		if s.messages[i].ID == messageID {
			// initialize reactions map if nil
			if s.messages[i].Reactions == nil {
				s.messages[i].Reactions = make(map[string][]string)
			}

			// Check if user already reacted with this emoji
			users := s.messages[i].Reactions[emoji]
			for j, id := range users {
				if id == userID {
					s.messages[i].Reactions[emoji] = append(users[:j], users[j+1:]...)
					// Remove emoji key if no users left
					if len(s.messages[i].Reactions[emoji]) == 0 {
						delete(s.messages[i].Reactions, emoji)
					}
					log.Printf("removed reaction %s from message %s for %s", emoji, messageID[:8], userID)

					// Broadcast updated message
					s.hub.BroadcastMessage("reaction_updated", map[string]any{
						"message_id": messageID,
						"emoji":      emoji,
						"user_id":    userID,
						"action":     "removed",
						"message":    s.messages[i],
					})
					return nil
				}
			}

			// Add reaction (toggle on)
			s.messages[i].Reactions[emoji] = append(users, userID)
			log.Printf("Added reaction %s to message %s from %s", emoji, messageID[:8], userID)

			s.hub.BroadcastMessage("reaction_updated", map[string]any{
				"message_id": messageID,
				"emoji":      emoji,
				"user_id":    userID,
				"action":     "added",
				"message":    s.messages[i],
			})
			return nil
		}
	}
	return ErrMessageNotFound
}

func (s *Store) GetUserID(clientIP string) string {
	userID := fmt.Sprintf("user_%s", clientIP)

	s.mu.Lock()
	if s.sessions[clientIP] == "" {
		s.sessions[clientIP] = userID
		log.Printf("new user session: %s", userID)
	}
	s.mu.Unlock()

	return userID
}
