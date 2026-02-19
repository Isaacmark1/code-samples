package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// TokenMaker interface for dependency injection
type TokenMaker interface {
	VerifyToken(token string) (*TokenPayload, error)
}

// TokenPayload represents authenticated user data
type TokenPayload struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

// AuthMiddleware provides JWT authentication with fallback to cookie-based auth
func AuthMiddleware(tokenMaker TokenMaker, db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var userID int64
			var payloadValid bool
			
			// Try Authorization: Bearer <token> header first
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Fields(authHeader)
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenStr := parts[1]
					payload, err := tokenMaker.VerifyToken(tokenStr)
					if err != nil {
						log.Printf("❌ [Auth] Invalid token: %v", err)
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusUnauthorized)
						json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
						return
					}
					userID = payload.UserID
					payloadValid = true
				}
			}

			// Fallback to cookie-based authentication
			if !payloadValid {
				cookie, err := r.Cookie("auth_token")
				if err != nil || cookie.Value == "" {
					log.Printf("🚫 [Auth] Missing authentication for %s %s", r.Method, r.URL.Path)
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
					return
				}

				payload, err := tokenMaker.VerifyToken(cookie.Value)
				if err != nil {
					log.Printf("❌ [Auth] Invalid token: %v", err)
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
					return
				}
				userID = payload.UserID
			}

			// Update last_seen asynchronously to avoid blocking request
			if db != nil && userID > 0 {
				go func() {
					_, err := db.Exec("UPDATE users SET last_seen = NOW() WHERE id = ?", userID)
					if err != nil {
						log.Printf("Warning: Failed to update last_seen for user %d: %v", userID, err)
					}
				}()
			}

			// Add user context to request
			ctx := context.WithValue(r.Context(), "userID", userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminMiddleware ensures authenticated user has admin privileges
func AdminMiddleware(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get userID from context (set by AuthMiddleware)
			userID, ok := r.Context().Value("userID").(int64)
			if !ok || userID == 0 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
				return
			}

			// Check if user has admin role
			var role string
			var email string
			err := db.QueryRow("SELECT role, email FROM users WHERE id = ?", userID).Scan(&role, &email)
			if err != nil {
				log.Printf("❌ [Admin] Failed to get user role and email: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Failed to verify admin privileges"})
				return
			}

			// Check if user has admin role
			isAdmin := role == "admin"

			// If not admin by role, check if email is in admin list
			if !isAdmin {
				// This would typically come from environment variables
				adminEmails := []string{"admin@example.com"} // Sanitized
				userEmail := strings.ToLower(strings.TrimSpace(email))
				for _, adminEmail := range adminEmails {
					if strings.ToLower(strings.TrimSpace(adminEmail)) == userEmail {
						isAdmin = true
						break
					}
				}
			}

			if !isAdmin {
				log.Printf("🚫 [Admin] User %d (%s) attempted admin access without privileges", userID, email)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{"error": "Admin privileges required"})
				return
			}

			// User is admin, proceed
			log.Printf("✅ [Admin] User %d (%s) accessing %s %s", userID, email, r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	}
}
