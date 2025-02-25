# Install

Installing `clarity` is easy. Simply pull it in via your package manager of choice, or download the binary directly.

## Package Managers

Choose your package manager of choice:

::: code-group

```sh [npm]
npm install --save-dev @stacksjs/clarity
# npm i -d @stacksjs/clarity

# or, install globally via
npm i -g @stacksjs/clarity
```

```sh [bun]
bun install --dev @stacksjs/clarity
# bun add --dev @stacksjs/clarity
# bun i -d @stacksjs/clarity

# or, install globally via
bun add --global @stacksjs/clarity
```

```sh [pnpm]
pnpm add --save-dev @stacksjs/clarity
# pnpm i -d @stacksjs/clarity

# or, install globally via
pnpm add --global @stacksjs/clarity
```

```sh [yarn]
yarn add --dev @stacksjs/clarity
# yarn i -d @stacksjs/clarity

# or, install globally via
yarn global add @stacksjs/clarity
```

```sh [brew]
brew install clarity # coming soon
```

```sh [pkgx]
pkgx clarity # coming soon
```

:::

Read more about how to use it in the Usage section of the documentation.

## Binaries

Choose the binary that matches your platform and architecture:

::: code-group

```sh [macOS (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/clarity/releases/download/v0.2.0/clarity-darwin-arm64 -o clarity

# Make it executable
chmod +x clarity

# Move it to your PATH
mv clarity /usr/local/bin/clarity
```

```sh [macOS (x64)]
# Download the binary
curl -L https://github.com/stacksjs/clarity/releases/download/v0.2.0/clarity-darwin-x64 -o clarity

# Make it executable
chmod +x clarity

# Move it to your PATH
mv clarity /usr/local/bin/clarity
```

```sh [Linux (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/clarity/releases/download/v0.2.0/clarity-linux-arm64 -o clarity

# Make it executable
chmod +x clarity

# Move it to your PATH
mv clarity /usr/local/bin/clarity
```

```sh [Linux (x64)]
# Download the binary
curl -L https://github.com/stacksjs/clarity/releases/download/v0.2.0/clarity-linux-x64 -o clarity

# Make it executable
chmod +x clarity

# Move it to your PATH
mv clarity /usr/local/bin/clarity
```

```sh [Windows (x64)]
# Download the binary
curl -L https://github.com/stacksjs/clarity/releases/download/v0.2.0/clarity-windows-x64.exe -o clarity.exe

# Move it to your PATH (adjust the path as needed)
move clarity.exe C:\Windows\System32\clarity.exe
```

::: tip
You can also find the `clarity` binaries in GitHub [releases](https://github.com/stacksjs/clarity/releases).
:::
