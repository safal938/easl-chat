# Board App: Clear Chats - Quick Reference

## Send Clear Chats Request

```javascript
// Get iframe
const iframe = document.getElementById('easl-iframe');

// Send message
iframe.contentWindow.postMessage({
  type: 'CLEAR_CHATS',
  payload: { timestamp: new Date().toISOString() }
}, 'http://localhost:3000');
```

## Listen for Response

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;
  
  if (event.data.type === 'EASL_RESPONSE') {
    if (event.data.payload.response.success) {
      console.log('✅ Chats cleared');
    } else {
      console.error('❌ Failed:', event.data.payload.response.error);
    }
  }
});
```

## Complete Button Example

```html
<button onclick="clearEaslChats()">Clear Chats</button>

<script>
function clearEaslChats() {
  const iframe = document.getElementById('easl-iframe');
  iframe.contentWindow.postMessage({
    type: 'CLEAR_CHATS',
    payload: { timestamp: new Date().toISOString() }
  }, 'http://localhost:3000');
}

window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;
  if (event.data.type === 'EASL_RESPONSE') {
    alert(event.data.payload.response.success ? 'Cleared!' : 'Failed!');
  }
});
</script>
```

## Test Page

Open: `http://localhost:3000/board-app-clear-chats-test.html`

## That's It!

No Firebase. No API. No complexity. Just postMessage.
