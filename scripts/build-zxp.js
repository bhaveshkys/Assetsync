#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const manifestPath = path.join(root, "CSXS", "manifest.xml");

let version = "1.0.0";
try {
  const m = fs.readFileSync(manifestPath, "utf8");
  const match = m.match(/ExtensionBundleVersion="([^"]+)"/);
  if (match) version = match[1];
} catch (e) {}

const zxpName = `AssetSync-v${version}.zxp`;
const zxpPath = path.join(dist, zxpName);
const certPath = path.join(__dirname, "cert.p12");
const certPass = "assetsync";

// Stage folder
const stage = path.join(dist, "zxp-stage");
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

// Copy extension files
["CSXS", "css", "js", "jsx"].forEach((d) => {
  cp.execSync(`cp -R "${path.join(root, d)}" "${stage}/"`);
});
["index.html", ".debug"].forEach((f) => {
  const p = path.join(root, f);
  if (fs.existsSync(p)) cp.execSync(`cp "${p}" "${stage}/"`);
});

// Remove any .DS_Store
cp.execSync(`find "${stage}" -name ".DS_Store" -delete || true`);

// Find ZXPSignCmd binary
let zxpBin = "";
try {
  const signer = require("zxp-signer");
  zxpBin = signer("4.1.3").replace(/"/g, "");
} catch (e) {
  try {
    const signer = require("/tmp/zxp/lib/node_modules/zxp-signer");
    zxpBin = signer("4.1.3").replace(/"/g, "");
  } catch (e2) {}
}

if (!zxpBin) {
  try {
    zxpBin = cp.execSync("which ZXPSignCmd", { encoding: "utf8" }).trim();
  } catch (e) {}
}

if (!zxpBin) {
  console.log("ZXPSignCmd not found. Installing zxp-signer to build ZXP...");
  cp.execSync("npm i -g --prefix /tmp/zxp zxp-signer", { stdio: "inherit" });
  const signer = require("/tmp/zxp/lib/node_modules/zxp-signer");
  zxpBin = signer("4.1.3").replace(/"/g, "");
}

// Ensure cert exists
if (!fs.existsSync(certPath)) {
  console.log("Generating self-signed certificate for ZXP...");
  cp.execSync(
    `"${zxpBin}" -selfSignedCert US CA "AssetSync" "AssetSync" "${certPass}" "${certPath}"`,
    { stdio: "inherit" }
  );
}

// Sign ZXP
console.log(`Signing ZXP -> ${zxpName}...`);
fs.rmSync(zxpPath, { force: true });
cp.execSync(
  `"${zxpBin}" -sign "${stage}" "${zxpPath}" "${certPath}" "${certPass}"`,
  { stdio: "inherit" }
);

// Verify ZXP
console.log("Verifying ZXP signature...");
cp.execSync(`"${zxpBin}" -verify "${zxpPath}"`, { stdio: "inherit" });

// Clean up stage
fs.rmSync(stage, { recursive: true, force: true });

console.log(`Success! ZXP created at: ${zxpPath}`);
