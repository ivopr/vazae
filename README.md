# Vazaê

Jogo de vazas com as cartas e a força do truco, contra robôs. Feito com [Wails 3](https://v3.wails.io/) (Go) e React.

## Baixar

As versões publicadas ficam na aba **Releases** do repositório:

- **Windows:** `vazae-X.Y.Z-windows-amd64-installer.exe` instala o jogo. O `vazae-X.Y.Z-windows-amd64.exe` roda sem instalar e precisa do WebView2, que já vem no Windows 10 e 11.
- **Android:** `vazae-X.Y.Z-android-arm64.apk`. Abra no celular e permita a instalação de fontes desconhecidas.

Cada push também gera esses arquivos: na aba **Actions**, abra a execução e baixe em **Artifacts**.

## Desenvolver

Requisitos: Go (versão no `go.mod`), Node LTS, pnpm e o CLI do Wails na mesma versão do `go.mod`:

```sh
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.34
wails3 dev                     # app com recarga automática
go test -short ./game/... ./solo/...
```

`go test` sem `-short` também roda os torneios entre robôs (cerca de 80 s).

## Builds e versões

O workflow [`.github/workflows/build.yml`](.github/workflows/build.yml) roda em todo push e pull request:

1. testa o motor e o serviço;
2. gera o `.exe` e o instalador do Windows;
3. gera o APK do Android (arm64).

Para lançar uma versão, crie e envie uma tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

O workflow cria o Release com os três arquivos. Tags com sufixo, como `v0.2.0-rc1`, saem marcadas como pré-lançamento.

Para gerar os mesmos arquivos localmente: `wails3 task windows:package` (precisa do NSIS) e `wails3 task android:package` (Linux ou macOS, com Android SDK, NDK e JDK 17+).

### Assinatura do Android

Por enquanto o APK é assinado com uma chave de teste, gerada a cada build. Por isso o Android não aceita uma versão nova por cima da antiga: é preciso desinstalar antes, e a Play Store recusa o arquivo.

Para assinar com uma chave própria e permitir atualizações:

1. Gere a chave uma vez e guarde-a em lugar seguro. Perder a chave impede publicar atualizações.

   ```sh
   keytool -genkeypair -v -keystore vazae.keystore -alias vazae -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Em **Settings > Secrets and variables > Actions**, crie quatro secrets:
   - `ANDROID_KEYSTORE_BASE64`: o arquivo em base64 (`base64 -w0 vazae.keystore`);
   - `ANDROID_KEYSTORE_PASSWORD`;
   - `ANDROID_KEY_ALIAS` (no exemplo, `vazae`);
   - `ANDROID_KEY_PASSWORD`.

O workflow passa a usar a chave sozinho, sem nenhuma mudança no código.

## Identidade do app

Nome, autor, descrição, ID (`com.vazae.app`) e versão base ficam em [`build/config.yml`](build/config.yml). Depois de mudar esse arquivo, rode `wails3 task common:update:build-assets` e revise o diff, porque ele reescreve os arquivos de cada plataforma em `build/`.
