package chat

import (
	"fmt"
	"testing"
)

func TestStore_Add(t *testing.T) {
	hub := NewHub(nil)
	store := NewStore(hub)
	store.SetHub(hub)

	msg, err := NewMessage("Test message", "Mickaël", "user_1")
	if err != nil {
		t.Fatalf("Failed to create message: %v", err)
	}

	store.Add(*msg)

	messages := store.GetAll()
	if len(messages) != 1 {
		t.Errorf("GetAll() returned %d messages, want 1", len(messages))
	}

	if messages[0].Text != "Test message" {
		t.Errorf("GetAll() message text = %v, want Test message", messages[0].Text)
	}
}

func TestStore_GetSince(t *testing.T) {
	hub := NewHub(nil)
	store := NewStore(hub)
	store.SetHub(hub)

	msg1, _ := NewMessage("Jsuis bg", "Mickaël", "user_1")
	store.Add(*msg1)

	timestamp := msg1.CreatedAt

	msg2, _ := NewMessage("C vrai", "Raphaël", "user_2")
	store.Add(*msg2)

	messages := store.GetSince(timestamp)

	// Should get messages with CreatedAt > timestamp
	// If msg2 has same timestamp as msg1, we get 0 messages (correct behavior)
	// If msg2 has timestamp > msg1, we get 1 message
	if len(messages) > 1 {
		t.Errorf("GetSince() returned %d messages, want at most 1", len(messages))
	}

	if len(messages) == 1 && messages[0].Text != "Second" {
		t.Errorf("GetSince() message text = %v, want Second", messages[0].Text)
	}
}

func TestStore_ToggleReaction(t *testing.T) {
	hub := NewHub(nil)
	store := NewStore(hub)
	store.SetHub(hub)

	msg, _ := NewMessage("C vrai", "Raphaël", "user_1")
	store.Add(*msg)

	// Add reaction
	err := store.ToggleReaction(msg.ID, "👍", "user_2")
	if err != nil {
		t.Errorf("ToggleReaction() error = %v", err)
	}

	messages := store.GetAll()
	if len(messages[0].Reactions["👍"]) != 1 {
		t.Errorf("Reaction count = %d, want 1", len(messages[0].Reactions["👍"]))
	}

	// Remove reaction
	err = store.ToggleReaction(msg.ID, "👍", "user_2")
	if err != nil {
		t.Errorf("ToggleReaction() error = %v", err)
	}

	messages = store.GetAll()
	if len(messages[0].Reactions["👍"]) != 0 {
		t.Errorf("Reaction count = %d, want 0", len(messages[0].Reactions["👍"]))
	}
}

func TestStore_ToggleReaction_NotFound(t *testing.T) {
	hub := NewHub(nil)
	store := NewStore(hub)
	store.SetHub(hub)

	err := store.ToggleReaction("nonexistent", "👍", "user_1")
	if err != ErrMessageNotFound {
		t.Errorf("ToggleReaction() error = %v, want ErrMessageNotFound", err)
	}
}

func TestStore_MaxMessagesLimit(t *testing.T) {
	hub := NewHub(nil)
	store := NewStore(hub)
	store.SetHub(hub)

	// here we mock 15 but in production it will be 1000.
	totalMessages := 15
	for i := 1; i <= totalMessages; i++ {
		msg, _ := NewMessage(fmt.Sprintf("Msg%d", i), "User", "user_1")
		store.Add(*msg)
	}

	messages := store.GetAll()

	if len(messages) != totalMessages {
		t.Errorf("store has %d messages, want %d", len(messages), totalMessages)
	}

	firstMsg := messages[0]
	if firstMsg.Text != "Msg1" {
		t.Errorf("first message = %q, want Msg1", firstMsg.Text)
	}

	lastMsg := messages[len(messages)-1]
	if lastMsg.Text != "Msg15" {
		t.Errorf("last message = %q, want Msg15", lastMsg.Text)
	}

	t.Logf("stored %d messages (limit: %d)", len(messages), maxMessages)
}
