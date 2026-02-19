// Package services demonstrates clean service layer patterns
package services

import (
	"context"
	"fmt"
	"log"
	"time"
)

// NotificationRepository interface for dependency injection
type NotificationRepository interface {
	Save(ctx context.Context, notification *Notification) error
	List(ctx context.Context, userID int64, page, limit int) ([]Notification, int64, error)
	MarkAsRead(ctx context.Context, userID int64, ids []int64) error
}

// WebSocketHub interface for real-time notifications
type WebSocketHub interface {
	SendToUser(userID int64, data interface{}) error
	Broadcast(data interface{}) error
}

// Notification represents a user notification
type Notification struct {
	ID        int64  `json:"id"`
	UserID    int64  `json:"user_id"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Type      string `json:"type"` // info|success|warning|error
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}

// NotificationService handles notification business logic
type NotificationService struct {
	repo NotificationRepository
	hub  WebSocketHub
}

// NewNotificationService creates a new notification service
func NewNotificationService(repo NotificationRepository, hub WebSocketHub) *NotificationService {
	return &NotificationService{
		repo: repo,
		hub:  hub,
	}
}

// CreateNotificationInput represents input for creating notifications
type CreateNotificationInput struct {
	UserID  int64  `json:"user_id"`
	Title   string `json:"title"`
	Message string `json:"message"`
	Type    string `json:"type"` // info|success|warning|error
}

// Validate ensures notification data is valid
func (in CreateNotificationInput) Validate() error {
	if in.UserID <= 0 {
		return fmt.Errorf("user_id is required and must be positive")
	}
	if in.Title == "" {
		return fmt.Errorf("title is required")
	}
	if len(in.Title) > 100 {
		return fmt.Errorf("title must be 100 characters or less")
	}
	if in.Message == "" {
		return fmt.Errorf("message is required")
	}
	if len(in.Message) > 500 {
		return fmt.Errorf("message must be 500 characters or less")
	}

	// Validate notification type
	validTypes := []string{"info", "success", "warning", "error"}
	isValidType := false
	for _, t := range validTypes {
		if in.Type == t {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return fmt.Errorf("type must be one of: info, success, warning, error")
	}

	return nil
}

// CreateAndPush creates a notification and sends it via WebSocket
func (s *NotificationService) CreateAndPush(ctx context.Context, in CreateNotificationInput) error {
	// Validate input
	if err := in.Validate(); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	// Create notification object
	n := &Notification{
		UserID:    in.UserID,
		Title:     in.Title,
		Message:   in.Message,
		Type:      in.Type,
		IsRead:    false,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	// Save to database
	if err := s.repo.Save(ctx, n); err != nil {
		return fmt.Errorf("failed to save notification: %w", err)
	}

	// Send real-time notification via WebSocket
	if s.hub != nil {
		if err := s.hub.SendToUser(in.UserID, n); err != nil {
			// Log error but don't fail the operation
			log.Printf("Warning: Failed to send real-time notification to user %d: %v", in.UserID, err)
		}
	}

	return nil
}

// List retrieves paginated notifications for a user
func (s *NotificationService) List(ctx context.Context, userID int64, page, limit int) ([]Notification, int64, error) {
	// Validate pagination parameters
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	return s.repo.List(ctx, userID, page, limit)
}

// MarkAsRead marks notifications as read for a user
func (s *NotificationService) MarkAsRead(ctx context.Context, userID int64, ids []int64) error {
	if len(ids) == 0 {
		return fmt.Errorf("no notification IDs provided")
	}

	// Validate all IDs are positive
	for _, id := range ids {
		if id <= 0 {
			return fmt.Errorf("invalid notification ID: %d", id)
		}
	}

	return s.repo.MarkAsRead(ctx, userID, ids)
}

// Broadcast sends a notification to all connected users
func (s *NotificationService) Broadcast(ctx context.Context, title, message, notificationType string) error {
	notification := &Notification{
		Title:     title,
		Message:   message,
		Type:      notificationType,
		IsRead:    false,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	if s.hub != nil {
		return s.hub.Broadcast(notification)
	}

	return fmt.Errorf("WebSocket hub not available")
}

// GetUnreadCount returns the count of unread notifications for a user
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID int64) (int64, error) {
	notifications, _, err := s.repo.List(ctx, userID, 1, 1) // Just to get count
	if err != nil {
		return 0, fmt.Errorf("failed to get notifications: %w", err)
	}

	// In a real implementation, this would be a dedicated database query
	// For demonstration, we'll count unread notifications
	unreadCount := int64(0)
	for _, notif := range notifications {
		if !notif.IsRead {
			unreadCount++
		}
	}

	return unreadCount, nil
}
