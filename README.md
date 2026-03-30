# conduit-node

`conduit-node` is the Bun agent installed onto an existing Vultr edge server.

## Fresh Ubuntu setup

These commands are intended for a fresh Ubuntu host. The Docker steps use
Docker's official apt repository and automatically select the current Ubuntu
codename.

### Install base packages and Bun

```bash
sudo apt update
sudo apt install -y ca-certificates curl git unzip

curl -fsSL https://bun.com/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

bun --version
```

### Install Docker Engine

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

sudo docker run hello-world
```

Optional, if you want to run `docker` without `sudo`:

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

### Clone the repo and install dependencies

```bash
git clone https://github.com/minenetpro/conduit-node.git
cd conduit-node
bun install
```

## Required environment

- `CONDUIT_CONTROLLER_URL`
- `CONDUIT_REGISTRATION_TOKEN` on first boot only
- `CONDUIT_NODE_LABEL`
- `CONDUIT_VULTR_INSTANCE_ID`
- `CONDUIT_VULTR_REGION`

Optional:

- `CONDUIT_STATE_DIR` defaults to `/var/lib/conduit-node`
- `CONDUIT_HEARTBEAT_SECONDS` defaults to `15`
- `CONDUIT_JOB_POLL_SECONDS` defaults to `10`
- `CONDUIT_NODE_VERSION` defaults to `0.1.0`

## Runtime contract

- Persists `nodeId` and `agentToken` under `CONDUIT_STATE_DIR`.
- Polls the controller for work.
- Writes FRPS config files under `CONDUIT_STATE_DIR/frps`.
- Runs FRPS containers with Docker host networking and labels them as Conduit-managed.

## Start

```bash
bun run start
```

## Vultr regions

Use one of the following region IDs for `CONDUIT_VULTR_REGION`. For the live
source of truth, query `curl https://api.vultr.com/v2/regions`.

| Region ID | City | Country | Continent |
| --- | --- | --- | --- |
| `jnb` | Johannesburg | ZA | Africa |
| `blr` | Bangalore | IN | Asia |
| `del` | Delhi NCR | IN | Asia |
| `bom` | Mumbai | IN | Asia |
| `itm` | Osaka | JP | Asia |
| `icn` | Seoul | KR | Asia |
| `sgp` | Singapore | SG | Asia |
| `tlv` | Tel Aviv | IL | Asia |
| `nrt` | Tokyo | JP | Asia |
| `mel` | Melbourne | AU | Australia |
| `syd` | Sydney | AU | Australia |
| `ams` | Amsterdam | NL | Europe |
| `fra` | Frankfurt | DE | Europe |
| `lhr` | London | GB | Europe |
| `mad` | Madrid | ES | Europe |
| `man` | Manchester | GB | Europe |
| `cdg` | Paris | FR | Europe |
| `sto` | Stockholm | SE | Europe |
| `waw` | Warsaw | PL | Europe |
| `atl` | Atlanta | US | North America |
| `ord` | Chicago | US | North America |
| `dfw` | Dallas | US | North America |
| `hnl` | Honolulu | US | North America |
| `lax` | Los Angeles | US | North America |
| `mex` | Mexico City | MX | North America |
| `mia` | Miami | US | North America |
| `ewr` | New Jersey | US | North America |
| `sea` | Seattle | US | North America |
| `sjc` | Silicon Valley | US | North America |
| `yto` | Toronto | CA | North America |
| `scl` | Santiago | CL | South America |
| `sao` | Sao Paulo | BR | South America |
