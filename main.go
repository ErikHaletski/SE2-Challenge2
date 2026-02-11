package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	router := gin.Default()
	router.GET("/ping", pong)
	router.GET("/produkte/:file", serveJSONHandler)
  router.Run() // listens on 0.0.0.0:8080 by default
}

func pong (c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
}

func serveJSONHandler(c *gin.Context) {
	filePathToRead := filepath.Join("content", "produkte", c.Param("file") + ".json")
	
	fileBytes, err := os.ReadFile(filePathToRead)
	if err != nil {
		panic(err)
	}

	c.Data(http.StatusOK, "application/json", fileBytes) 
}
