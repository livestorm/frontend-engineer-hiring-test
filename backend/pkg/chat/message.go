package chat

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEmptyMessage    = errors.New("message text cannot be empty")
	ErrMessageTooLong  = errors.New("message too long (max 500 characters)")
	ErrMessageNotFound = errors.New("message not found")
)

type Message struct {
	ID         string              `json:"id"`
	Text       string              `json:"text"`
	AuthorID   string              `json:"author_id"`
	AuthorName string              `json:"author_name"`
	CreatedAt  int64               `json:"created_at"`
	Reactions  map[string][]string `json:"reactions"`
}

func NewMessage(text, authorName, authorID string) (*Message, error) {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, ErrEmptyMessage
	}
	if len(text) > 500 {
		return nil, ErrMessageTooLong
	}
	if authorName == "" {
		authorName = "Anonymous"
	}

	return &Message{
		ID:         uuid.New().String(),
		Text:       text,
		AuthorName: authorName,
		AuthorID:   authorID,
		CreatedAt:  time.Now().Unix(),
		Reactions:  make(map[string][]string),
	}, nil
}
