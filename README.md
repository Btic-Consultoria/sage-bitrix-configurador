# Sage-Bitrix Configurator

A desktop application built with Tauri and React to configure the connection between Sage 200c and Bitrix24 CRM.

## Features

- Configure database connection details for Sage 200c
- Set up Bitrix24 CRM integration settings
- Map Bitrix24 companies to Sage company codes
- Generate a configuration JSON file

## Project Structure

```
sage-bitrix-configurator/
├── src/                 # React source files
│   ├── components/      # React components
│   └── utils/           # Utility functions
├── src-tauri/           # Tauri backend code
│   ├── src/             # Rust source files
│   └── Cargo.toml       # Rust dependencies
├── public/              # Public assets
└── package.json         # Node.js dependencies
```

## Setup and Installation

### Prerequisites

- Node.js (v16 or later)
- Rust (for Tauri)
- Tauri CLI

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sage-bitrix-configurator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## Usage

1. Log in with any username and password (no authentication in demo version)
2. Configure the database settings
3. Configure the Bitrix24 integration
4. Add company mappings
5. Generate the configuration file

## Customization

- Colors can be adjusted in `tailwind.config.cjs`
- Branding can be updated by replacing logo files in the `public` directory

## Adding Encryption

The current version generates plain JSON files. To add encryption:

1. Update the Dashboard component to include encryption logic
2. Add Tauri commands for encryption/decryption in Rust
3. Configure appropriate dependencies in Cargo.toml

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Company Information

&copy; 2025 Bussiness Tic Consultoria. All rights reserved.