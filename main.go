package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"

	"vazae/game"
	"vazae/solo"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
//
//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// Registering the event gives the frontend a typed payload for it.
	application.RegisterEvent[game.PlayerView](solo.StateEvent)
}

func main() {
	app := application.New(application.Options{
		Name:        "Vazaê",
		Description: "Fodinha com regras de truco, contra robôs ou online",
		Services: []application.Service{
			application.NewService(solo.NewService()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "Vazaê",
		Width:     1100,
		Height:    760,
		MinWidth:  360,
		MinHeight: 560,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		// Matches the dark felt so the window doesn't flash before the page paints.
		BackgroundColour: application.NewRGB(0x14, 0x33, 0x26),
		URL:              "/",
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
