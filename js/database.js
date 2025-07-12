
class NzijaDatabase {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            const SUPABASE_URL = "https://avwdsgyvbvqxrohacvcq.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2d2RzZ3l2YnZxeHJvaGFjdmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTkyMTMsImV4cCI6MjA2NzI3NTIxM30.F4MapgSz5MlH1Ye9uNndZQGTy0b5oVzXb4co5H-XzoI";
            
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.initialized = true;
            console.log('✅ Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            return false;
        }
    }

    // User Profile Operations
    async createUserProfile(userId, userData) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    full_name: userData.full_name,
                    role: userData.role,
                    phone: userData.phone || null,
                    is_active: true,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting user profile:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserProfile(userId, updates) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    }

    // Menu Operations (for vendors)
    async getMenuItems(vendorId) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('menu_items')
                .select('*')
                .eq('vendor_id', vendorId)
                .eq('is_available', true)
                .order('category', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting menu items:', error);
            return { success: false, error: error.message };
        }
    }

    async addMenuItem(vendorId, itemData) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('menu_items')
                .insert({
                    vendor_id: vendorId,
                    name: itemData.name,
                    description: itemData.description,
                    price: itemData.price,
                    category: itemData.category,
                    image_url: itemData.image_url || null,
                    is_available: true,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding menu item:', error);
            return { success: false, error: error.message };
        }
    }

    // Order Operations
    async createOrder(orderData) {
        if (!this.initialized) await this.initialize();

        try {
            const { data, error } = await this.supabase
                .from('orders')
                .insert({
                    customer_id: orderData.customer_id,
                    vendor_id: orderData.vendor_id,
                    items: orderData.items,
                    total_amount: orderData.total_amount,
                    delivery_address: orderData.delivery_address,
                    customer_phone: orderData.customer_phone,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrders(userId, role) {
        if (!this.initialized) await this.initialize();

        try {
            let query = this.supabase
                .from('orders')
                .select(`
                    *,
                    customer:user_profiles!customer_id(full_name, phone),
                    vendor:user_profiles!vendor_id(full_name, business_name),
                    rider:user_profiles!rider_id(full_name, phone)
                `)
                .order('created_at', { ascending: false });

            if (role === 'customer') {
                query = query.eq('customer_id', userId);
            } else if (role === 'vendor') {
                query = query.eq('vendor_id', userId);
            } else if (role === 'rider') {
                query = query.or(`rider_id.eq.${userId},status.eq.ready_for_pickup`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting orders:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(orderId, status, riderId = null) {
        if (!this.initialized) await this.initialize();

        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            };

            if (riderId) {
                updateData.rider_id = riderId;
                updateData.picked_up_at = new Date().toISOString();
            }

            if (status === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
            }

            const { data, error } = await this.supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating order status:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time subscriptions
    subscribeToOrders(userId, role, callback) {
        if (!this.initialized) return null;

        let channel;
        
        if (role === 'customer') {
            channel = this.supabase
                .channel('customer-orders')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'orders',
                        filter: `customer_id=eq.${userId}`
                    }, 
                    callback
                )
                .subscribe();
        } else if (role === 'vendor') {
            channel = this.supabase
                .channel('vendor-orders')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'orders',
                        filter: `vendor_id=eq.${userId}`
                    }, 
                    callback
                )
                .subscribe();
        } else if (role === 'rider') {
            channel = this.supabase
                .channel('rider-orders')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'orders'
                    }, 
                    callback
                )
                .subscribe();
        }

        return channel;
    }
}

// Create global database instance
window.nzijaDB = new NzijaDatabase();
