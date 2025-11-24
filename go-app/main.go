package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "🚀 Hello from Go App inside Docker + Alpine!")
	})

	fmt.Println("✅ Go App running on port 8080")
	http.ListenAndServe(":8080", nil)
}
