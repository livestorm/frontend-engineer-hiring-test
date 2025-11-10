package main

import (
	"log"
	"net/http"
	"os"

	"chat-backend/pkg/chat"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var hub *chat.Hub
	store := chat.NewStore(nil)
	hub = chat.NewHub(store)
	store.SetHub(hub)
	handler := chat.NewHandler(store, hub)
	mock := chat.NewMockService(store)

	// start webSocket hub
	go hub.Run()
	mock.Start()

	http.HandleFunc("/health", handler.Health)
	http.HandleFunc("/ws", handler.HandleWebSocket)

	log.Printf("Server running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
