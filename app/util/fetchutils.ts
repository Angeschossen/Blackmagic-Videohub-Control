export function getPostHeader(e: any): RequestInit {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
  
      body: JSON.stringify(e),
    };
  }