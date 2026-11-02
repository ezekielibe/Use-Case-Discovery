import { QRCodeSVG } from "qrcode.react";
import { Text, Title1 } from "@fluentui/react-components";

export default function QrCode() {
  const url = `${window.location.origin}/submit`;
  return (
    <div className="panel qr">
      <Title1>Scan to share your idea</Title1>
      <QRCodeSVG value={url} size={320} marginSize={2} />
      <Text size={500} weight="semibold">
        {url}
      </Text>
      <Text className="muted">No sign-in required.</Text>
    </div>
  );
}
