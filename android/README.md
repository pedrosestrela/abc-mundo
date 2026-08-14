# ABC Mundo — Android (TWA)

Este diretório contém a configuração para empacotar o ABC Mundo como uma
Trusted Web Activity (TWA) Android, usando o [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).

O ficheiro `twa-manifest.json` já define:

- `packageId`: `com.abcmundo.app`
- `host`: `abc-mundo-api.fly.dev`
- `themeColor`: `#ff6b6b`
- `backgroundColor` claro (`#fff7e6`)
- `playBilling` e `notifications` desativados (a app não tem compras nem notificações)

## Passo a passo

1. Instalar o Bubblewrap CLI:
   ```
   npm install -g @bubblewrap/cli
   ```

2. Inicializar o projeto Android a partir do manifest existente:
   ```
   npx @bubblewrap/cli init --manifest=./twa-manifest.json
   ```
   (ou aponta para o `manifest.json` da app em produção,
   `https://abc-mundo-api.fly.dev/manifest.json`, se preferires gerar do zero)

3. Construir o APK/AAB:
   ```
   npx @bubblewrap/cli build
   ```

4. Assinar e publicar seguindo as instruções normais da Google Play Console.
   O ficheiro de keystore gerado (`*.keystore` / `*.jks`) NÃO deve ser
   commitado (já está no `.gitignore` da raiz do projeto).

## Notas

- A app depende de o domínio `abc-mundo-api.fly.dev` estar publicamente
  acessível e a servir `manifest.json` e `icon.svg` corretamente antes de
  gerar o TWA.
- `playBilling` e `notifications` estão desativados por não serem
  necessários nesta v1.
