# 🔌 API Explorer

A modern, interactive OpenAPI/Swagger API client with live execution, bookmarking, and Kibana space support.

![Build Status](https://github.com/YOUR_USERNAME/api-explorer/workflows/Build%20and%20Release/badge.svg)

## ✨ Features

- 🎨 **Modern Glass UI** - Beautiful glass morphism design with gradient accents
- 🔍 **Smart Search** - Full-text search across operation IDs, summaries, and descriptions
- 🚀 **Live Execution** - Execute API requests with visual parameter builder
- 🔖 **Bookmarking** - Save frequently used operations with parameters
- 🔐 **Secure Credentials** - AES-GCM encrypted API credentials with master password
- 🌈 **Theme Selection** - 5 beautiful color themes (Indigo, Cyan, Rose, Amber, Emerald)
- 🪐 **Kibana Spaces** - Native support for Kibana space-aware API paths
- 📋 **Copy Response** - One-click copy response to clipboard
- 🖥️ **Desktop App** - Cross-platform native builds via Tauri

## 🖼️ Screenshots

*Screenshots will be added here*

## 🚀 Quick Start

### Web Version

```bash
cd api-explorer
npm install
npm run dev
```

Open http://localhost:5173

### Desktop App

```bash
# Install Rust (first time only)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
npm install -g @tauri-apps/cli

# Run development version
npm run tauri dev

# Build for production
npm run tauri build
```

## 📦 Download

Download the latest release for your platform:

- [Linux (.deb)](https://github.com/YOUR_USERNAME/api-explorer/releases)
- [macOS (.dmg)](https://github.com/YOUR_USERNAME/api-explorer/releases)
- [Windows (.msi)](https://github.com/YOUR_USERNAME/api-explorer/releases)

## 🔧 Configuration

### Schema Registry

Add your own OpenAPI schemas by editing `public/schemas/schema_register.json`:

```json
{
  "schemas": [
    {
      "title": "My API",
      "downloads_to_file": "my-api.yaml",
      "can_download_from": "https://example.com/api/openapi.yaml"
    }
  ]
}
```

### API Instances

Save multiple API instances (URLs + credentials) securely:
1. Click the `+` button in the toolbar
2. Enter instance name, URL, and authentication
3. Set a master password to encrypt credentials
4. Select the instance from the dropdown to auto-fill auth

## 🎨 Themes

Choose from 5 built-in color themes:

| Theme | Preview |
|-------|---------|
| Indigo (Default) | ![#6366f1](https://via.placeholder.com/20/6366f1/6366f1.png) |
| Ocean Cyan | ![#06b6d4](https://via.placeholder.com/20/06b6d4/06b6d4.png) |
| Rose Red | ![#f43f5e](https://via.placeholder.com/20/f43f5e/f43f5e.png) |
| Amber Gold | ![#f59e0b](https://via.placeholder.com/20/f59e0b/f59e0b.png) |
| Emerald Green | ![#10b981](https://via.placeholder.com/20/10b981/10b981.png) |

## 🔒 Security

- Credentials are encrypted using AES-GCM with PBKDF2 key derivation
- Master password is never stored, only used for encryption/decryption
- Decrypted credentials are kept in memory only (session-based)

## 🏗️ Development

### Project Structure

```
api-explorer/
├── src/
│   ├── components/     # React components
│   ├── services/       # API and crypto services
│   ├── stores/         # Zustand state management
│   ├── models/         # TypeScript types
│   └── styles.css      # Global styles
├── src-tauri/          # Tauri Rust backend
├── public/schemas/     # OpenAPI schema files
└── tests/              # Unit tests
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run tauri dev` - Run Tauri development build
- `npm run tauri build` - Build Tauri production binaries

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/), [Vite](https://vitejs.dev/), and [Tauri](https://tauri.app/)
- Styled with glass morphism inspiration from modern UI trends
- Icons and design inspired by the Elastic ecosystem
