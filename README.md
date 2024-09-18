# Accessing Your Local Mac Web Server from Your iPhone

This guide explains how to view your local website running on your Mac from your iPhone.

## Prerequisites

- Both your Mac and iPhone are connected to the same Wi-Fi network.
- Your web server is running on your Mac (e.g., at `http://localhost:8000/index.html`).

## Steps

### 1. Find Your Mac's Local IP Address

Open **Terminal** on your Mac and run:

```bash
ipconfig getifaddr en0
```

- Use `en0` for Ethernet or `en1` for Wi-Fi.
- The command will display your Mac's local IP address (e.g., `192.168.1.5`).

### 2. Configure Your Web Server to Listen on All Network Interfaces

When starting your web server, bind it to all interfaces (`0.0.0.0`) to make it accessible over the network.

**Example using Python's HTTP server:**

```bash
python -m http.server 8000 --bind 0.0.0.0
```

### 3. Adjust Firewall Settings (If Necessary)

- Go to **System Preferences** > **Security & Privacy** > **Firewall**.
- Click on **Firewall Options**.
- Ensure your web server application is allowed to accept incoming connections.

### 4. Access the Website from Your iPhone

- Open a web browser on your iPhone.
- Enter the URL using your Mac's IP address:

  ```
  http://<Your_Mac_IP_Address>:8000/index.html
  ```

  - Replace `<Your_Mac_IP_Address>` with the IP address you found earlier.

### 5. Troubleshooting Tips

- **Connection Issues**:
  - Ensure both devices are on the same network.
  - Verify the IP address and port number.
  - Confirm that the server is running.

- **Server Not Accessible**:
  - Check for VPNs or proxies that might interfere.
  - Temporarily disable the firewall to test connectivity.

# Serving Your Local Website Over HTTPS Accessible from an iPhone

This guide explains how to set up an HTTPS server on your Mac to serve your local website, accessible securely from your iPhone over the same Wi-Fi network. It includes steps to create a trusted SSL certificate, configure your Python server, and install the certificate on your iPhone using Safari.

---

## Preprequisites

- **Python 3** installed on your Mac.
- **Homebrew** installed on your Mac.
- **`mkcertj`** installed via Homebrew.
- Your web content (e.g., `index.html`) ready in a directory.
- Both your Mac and iPhone connected to the same Wi-Fi network.

---

## Steps

### 1. Install `mkcert` and Set Up a Local A

Open **Terminal** and run:

```sh
brew install mkcert
mkcert -install
```

### 2. Find Your Mac's Local IP Address

Run the following command in Terminal:

```sh
ipconfig getifaddr en0
```

- *Note*: If you're using Wi-Fi, you might need to use en1 (e.g., `ipconfig getifaddr en1`).
- **Example Output**: `192.168.1.5`.
- **Record this IP addressc**, as you'll need it in subsequent steps.

### 3. Generate a Trusted SSL Certificate

Generate a certificate for your Mac' IP address:

```sh
mkcert 192.168.1.5
```
- Replace **192.168.1.5** with your actual IP address.
- This command creates two files:
  - `192.168.1.5.pem` (certificate)
  - `192.168.1.5-key.pem` (private key)

### 4. Modify `server.py`

Update your `server.py` file with the following content:

```python
ip = '192.168.1.5' # Your Mac's Local IP Address
```
- Code will then point at your actual certificate and key.

### 5. Start the HTTPS Server

Run the Python server:

```sh
python3 server.py
```

Your server is now running with HTSP on port 8000.

### 6. Serve the Certificate for Installation on iPhone

To trust the SSL root certificate on your iPhone, you need to install it. You can serve the certificate file (e.g. `192.168.1.5.pem`) over HTTP and download it using Safari on your iPhone.

First, start a simple HTTP server to serve the certificate:

```sh
python3 -m http.server 8001 --bind 0.0.0.0
```

### 7. Install the Certificate on Your iPhone

On your iPhone:

1. Open Safari (be sure not to use other browsers) and navigate to `http://192.168.1.5:8001/192.168.1.5.pem`

  - Replace **192.168.1.5** with your Mac's IP address.

2. Safari will prompt you to install the profile. Follow the on-screen instructions to download the profile.

3. Go to **Settings > General > VPN & Device Management**.

4. Under **Downloaded Profile**, you should see the certificate. Tap on it and install it.

5. After installing, go to **Settings > General > About > Certificate Trust Settings**.

6. Enable full trust for the root certificate you just installed.

### 8. Access Your Local Website from iPhone

Now, on your iPhone, open Safari and navigate to:

```
https://192.168.1.5:8000
```

- Replace **192.168.1.5** with your Mac's IP address.

You should be able to access your local website securely over HTSP without certificate warnings (or silencing the warnings).

---

