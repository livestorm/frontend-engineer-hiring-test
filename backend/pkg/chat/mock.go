package chat

import (
	"fmt"
	"log"
	"os"
	"time"
)

type MockService struct {
	store *Store
}

func NewMockService(store *Store) *MockService {
	return &MockService{store: store}
}

func (m *MockService) Start() {
	mode := os.Getenv("MOCK_MODE")
	if mode == "" {
		return
	}

	go func() {
		m.addWelcomeMessage()

		switch mode {
		case "stress":
			m.stressMode()
		case "extreme":
			m.extremeMode()
		default:
			m.normalMode()
		}
	}()
}

func (m *MockService) addWelcomeMessage() {
	msg, err := NewMessage("Welcome to the chat!", "System", "system")
	if err != nil {
		log.Printf("failed to create welcome message: %v", err)
		return
	}
	m.store.Add(*msg)
}

func (m *MockService) normalMode() {
	messages := []string{
		"Great presentation!",
		"Can you share the slides?",
		"Very helpful, thanks",
		"What about mobile support?",
		"Love this new feature!",
	}

	for i, text := range messages {
		time.Sleep(10 * time.Second)
		msg, err := NewMessage(text, fmt.Sprintf("User%d", i+1), fmt.Sprintf("user_%d", i))
		if err != nil {
			log.Printf("failed to create test message: %v", err)
			continue
		}
		m.store.Add(*msg)
	}
}

func (m *MockService) stressMode() {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for i := 0; i < 300; i++ {
		<-ticker.C
		msg, err := NewMessage(
			fmt.Sprintf("Stress test message #%d", i),
			fmt.Sprintf("Bot%d", i%10),
			fmt.Sprintf("bot_%d", i%10),
		)
		if err != nil {
			log.Printf("failed to create test message: %v", err)
			continue
		}
		m.store.Add(*msg)
	}
}

func (m *MockService) extremeMode() {
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()

	for i := 0; i < 1000; i++ {
		<-ticker.C
		msg, err := NewMessage(
			fmt.Sprintf("EXTREME #%d ⚡", i),
			fmt.Sprintf("ExtremeBot%d", i%20),
			fmt.Sprintf("extreme_%d", i%20),
		)
		if err != nil {
			log.Printf("failed to create test message: %v", err)
			continue
		}
		m.store.Add(*msg)
	}
}
