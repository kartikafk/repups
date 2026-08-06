/**
 * Thin adapter over whichever video vendor you pick (Daily.co, Twilio
 * Video, Agora, LiveKit...). Keeping this as the only file that knows
 * the vendor's SDK means swapping providers later is a one-file change,
 * and it's what backs "no phone numbers shared" — the DB and frontend
 * never see raw connection info, only a short-lived room token.
 */

export async function createCallRoom(bookingId) {
  // Example (Daily.co REST API):
  //
  // const res = await fetch("https://api.daily.co/v1/rooms", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     name: `booking-${bookingId}`,
  //     properties: { exp: Math.floor(Date.now() / 1000) + 60 * 60 },
  //   }),
  // });
  // const room = await res.json();
  // return { id: room.name, url: room.url };

  return { id: `room_${bookingId}`, url: `https://video.example.com/room_${bookingId}` };
}

export async function issueJoinToken(roomId, user) {
  // Example (Daily.co meeting tokens):
  //
  // const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     properties: { room_name: roomId, user_name: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 30 },
  //   }),
  // });
  // const { token } = await res.json();
  // return { value: token, roomUrl: `https://your-domain.daily.co/${roomId}` };

  return { value: `stub_token_for_${user.id}`, roomUrl: `https://video.example.com/${roomId}` };
}