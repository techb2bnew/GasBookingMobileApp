// Socket Test Utility
// This file helps debug socket connection issues

export const testSocketConnection = (socket) => {
  if (!socket) {
    console.log('❌ Socket is null or undefined');
    return false;
  }

  console.log('🔍 Testing socket connection...');
  console.log('🔍 Socket connected:', socket.connected);
  console.log('🔍 Socket ID:', socket.id);
  console.log('🔍 Socket transport:', socket.io.engine.transport.name);

  // Test ping-pong
  socket.emit('ping', { test: 'socket connection test' });
  
  // Listen for pong
  socket.on('pong', (data) => {
    console.log('🏓 Pong received:', data);
  });

  // Test if we can emit events
  socket.emit('test-event', { message: 'Testing socket emission' });

  return true;
};

export const testProductAvailabilityEvent = (socket, productId, agencyId, isActive) => {
  if (!socket) {
    console.log('❌ Socket is null for product availability test');
    return;
  }

  console.log('🧪 Testing product availability event...');
  
  const testData = {
    type: 'PRODUCT_AVAILABILITY_CHANGED',
    data: {
      productId: productId || 'test-product-id',
      productName: 'Test Product',
      agencyId: agencyId || 'test-agency-id',
      isActive: isActive !== undefined ? isActive : false,
      stock: 10,
      action: 'updated'
    },
    timestamp: new Date()
  };

  // Listen for the test event
  socket.on('product:availability-changed', (data) => {
    console.log('🎯 Test product availability event received:', data);
  });

  // Emit test event (this would normally come from backend)
  console.log('📤 Emitting test product availability event:', testData);
  socket.emit('product:availability-changed', testData);
};

export const logSocketRooms = (socket) => {
  if (!socket) {
    console.log('❌ Socket is null for room logging');
    return;
  }

  console.log('🏠 Socket rooms:', socket.rooms);
  console.log('🏠 Socket adapter rooms:', socket.io.engine.rooms);
};

