package chat

import (
	"testing"
)

func TestNewMessage(t *testing.T) {
	tests := []struct {
		name       string
		text       string
		authorName string
		authorID   string
		wantErr    error
	}{
		{
			name:       "valid message",
			text:       "Hello world",
			authorName: "Mickaël",
			authorID:   "user_1",
			wantErr:    nil,
		},
		{
			name:       "empty text",
			text:       "",
			authorName: "Mickaël",
			authorID:   "user_1",
			wantErr:    ErrEmptyMessage,
		},
		{
			name:       "whitespace only",
			text:       "   ",
			authorName: "Mickaël",
			authorID:   "user_1",
			wantErr:    ErrEmptyMessage,
		},
		{
			name:       "too long message",
			text:       string(make([]byte, 501)),
			authorName: "Mickaël",
			authorID:   "user_1",
			wantErr:    ErrMessageTooLong,
		},
		{
			name:       "empty author name defaults to Anonymous",
			text:       "Hello",
			authorName: "",
			authorID:   "user_1",
			wantErr:    nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			msg, err := NewMessage(tt.text, tt.authorName, tt.authorID)

			if err != tt.wantErr {
				t.Errorf("NewMessage() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err == nil {
				if msg == nil {
					t.Error("NewMessage() returned nil message")
					return
				}
				if msg.ID == "" {
					t.Error("NewMessage() ID is empty")
				}
				if msg.CreatedAt == 0 {
					t.Error("NewMessage() CreatedAt is zero")
				}
				if msg.Reactions == nil {
					t.Error("NewMessage() Reactions is nil")
				}
				if tt.authorName == "" && msg.AuthorName != "Anonymous" {
					t.Errorf("NewMessage() AuthorName = %v, want Anonymous", msg.AuthorName)
				}
			}
		})
	}
}
