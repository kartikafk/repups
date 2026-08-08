// This is a SNIPPET, not a full file — drop these two lines into your
// existing client-facing trainer profile component (the one clients see
// when viewing a trainer's page).
//
// Because it reads `trainer.photoUrl` from the same API response your
// trainer edit view uses, it needs ZERO future changes: whatever photo the
// trainer uploads (or re-uploads) just shows up here automatically.

import Avatar from "./components/Avatar";

// Inside your client-facing component, wherever the trainer's photo/initials
// currently render, replace it with:

<Avatar
  src={trainer.photoUrl}
  name={trainer.name}
  size={90}
  // no `editable` prop -> read-only, clients can't upload
/>

// That's it. No onFileSelect, no upload handler, no API calls needed here —
// this view only ever displays what the trainer already saved.