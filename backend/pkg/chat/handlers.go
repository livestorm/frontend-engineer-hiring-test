package chat

import (
	"encoding/json"
	"net/http"
	"time"
)

type Handler struct {
	store *Store
	hub   *Hub
}

func NewHandler(store *Store, hub *Hub) *Handler {
	return &Handler{store: store, hub: hub}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "healthy",
		"time":   time.Now().Unix(),
	}); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}
