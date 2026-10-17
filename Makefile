.PHONY: dev frontend backend emulator

dev:
	$(MAKE) -j2 backend emulator

frontend:
	cd frontend && npm run dev

backend:
	cd backend && npm run dev

emulator:
	cd backend && npx firebase-tools emulators:start --only firestore --project demo-todo-app
