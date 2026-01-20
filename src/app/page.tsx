// Auto-redirect recovery tokens to reset-password page
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  const hash = window.location.hash;
  if (hash.includes('type=recovery') && hash.includes('access_token')) {
    console.log('🔐 Token de recuperación detectado, redirigiendo...');
    window.location.href = `/reset-password${hash}`;
  }
}, []);