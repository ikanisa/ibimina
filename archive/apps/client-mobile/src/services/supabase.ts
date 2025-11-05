import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.SUPABASE_URL || "https://YOUR_PROJECT.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helpers
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

// Account services
export const accountService = {
  async getAccounts(userId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAccountById(accountId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTransactions(accountId: string, limit = 50) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

// Group services
export const groupService = {
  async getUserGroups(userId: string) {
    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .eq("user_id", userId)
      .eq("group.status", "active");

    if (error) throw error;
    return data;
  },

  async getGroupDetails(groupId: string) {
    const { data, error } = await supabase
      .from("groups")
      .select(
        `
        *,
        members:group_members(
          *,
          user:users(id, full_name, avatar_url)
        )
      `
      )
      .eq("id", groupId)
      .single();

    if (error) throw error;
    return data;
  },

  async getGroupTransactions(groupId: string, limit = 50) {
    const { data, error } = await supabase
      .from("group_transactions")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

// Loan services
export const loanService = {
  async getUserLoans(userId: string) {
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("user_id", userId)
      .order("application_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async applyForLoan(loanData: {
    user_id: string;
    account_id: string;
    amount: number;
    term_months: number;
    purpose?: string;
  }) {
    const { data, error } = await supabase
      .from("loans")
      .insert({
        ...loanData,
        status: "pending",
        application_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLoanDetails(loanId: string) {
    const { data, error } = await supabase.from("loans").select("*").eq("id", loanId).single();

    if (error) throw error;
    return data;
  },
};

// Payment services
export const paymentService = {
  async initiatePayment(paymentData: {
    user_id: string;
    account_id: string;
    amount: number;
    payment_method: string;
    provider?: string;
    phone_number?: string;
  }) {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        ...paymentData,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentStatus(paymentId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

// Notification services
export const notificationService = {
  async getNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
  },
};

// User profile services
export const userService = {
  async getUserProfile(userId: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: { uri: string; type: string; name: string }) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const formData = new FormData();
    formData.append("file", file as any);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, formData, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    await userService.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },
};
