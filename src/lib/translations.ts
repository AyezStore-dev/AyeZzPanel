import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'id';

export interface Translations {
  // Navigation & Tabs
  nav_overview: string;
  nav_processes: string;
  nav_shell: string;
  nav_system: string;
  nav_files: string;
  nav_npm: string;
  nav_servers: string;
  nav_server_mgt: string;
  nav_hosting_mgt: string;
  nav_support: string;
  nav_billing: string;
  nav_settings: string;
  nav_profile: string;
  nav_users: string;
  nav_audit: string;
  nav_ssh_term: string;

  // Header System titles
  title_overview: string;
  title_processes: string;
  title_shell: string;
  title_system: string;
  title_files: string;
  title_npm: string;
  title_servers: string;
  title_server_mgt: string;
  title_hosting_mgt: string;
  title_support: string;
  title_billing: string;
  title_settings: string;
  title_profile: string;
  title_users: string;
  title_audit: string;
  title_ssh_term: string;

  // Header general info & widgets
  uptime: string;
  active_server: string;
  syslogs_alerts: string;
  clear: string;
  sign_out: string;
  server_state: string;
  online: string;

  // Common buttons / placeholders
  save: string;
  cancel: string;
  delete: string;
  add: string;
  edit: string;
  search: string;
  actions: string;
  status: string;
  back_to_dashboard: string;
  copy_output: string;
  clear_text: string;

  // Notifications or specific common strings
  auth_success: string;
  auth_failed: string;
  log_out_success: string;
}

const dictionaries: Record<Language, Translations> = {
  en: {
    nav_overview: "Analytics Overview",
    nav_processes: "OS Processes",
    nav_shell: "Terminal Shell",
    nav_system: "Hardware Info",
    nav_files: "File Manager",
    nav_npm: "Node Dependencies",
    nav_servers: "Virtual Servers",
    nav_server_mgt: "Server CLI Tools",
    nav_hosting_mgt: "Hosting Space",
    nav_support: "Support Tickets",
    nav_billing: "Billing Portal",
    nav_settings: "System Settings",
    nav_profile: "My Profile",
    nav_users: "User Management",
    nav_audit: "Security Auditing",
    nav_ssh_term: "Terminal SSH",

    title_overview: "Core Engine Analytics Overview",
    title_processes: "Live Operating System Process Table",
    title_shell: "Secure Administrative Terminal Console",
    title_system: "Complete System Hardware Specifications",
    title_files: "Live Operating System File Explorer & Editor",
    title_npm: "Automated Workspace Node Dependency Graph",
    title_servers: "Web Services / Host Virtual Server Manager",
    title_server_mgt: "Server Node Management & CLI",
    title_hosting_mgt: "Hosting Management & Workspace Files",
    title_support: "24/7 Technical Support Portal",
    title_billing: "Billing Portal & Subscriptions",
    title_settings: "System Administrator Settings",
    title_profile: "User Account Profile Details",
    title_users: "User Administrations Management",
    title_audit: "Security Audit Log Monitoring",
    title_ssh_term: "Browser-based SSH Terminal Console",

    uptime: "UPTIME",
    active_server: "Active Server Node",
    syslogs_alerts: "Panel Alerts & Syslogs",
    clear: "Clear",
    sign_out: "Sign Out",
    server_state: "Server State",
    online: "ONLINE",

    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    add: "Create New",
    edit: "Edit Profile",
    search: "Query search...",
    actions: "Actions",
    status: "Status",
    back_to_dashboard: "Back to Dashboard",
    copy_output: "Copy Output",
    clear_text: "Clear Text",

    auth_success: "Authentication successful! Welcome back!",
    auth_failed: "Authentication failed. check credentials.",
    log_out_success: "Session secure closed successfully."
  },
  id: {
    nav_overview: "Ikhtisar Analisis",
    nav_processes: "Proses OS",
    nav_shell: "Terminal Shell",
    nav_system: "Info Hardware",
    nav_files: "Manajer File",
    nav_npm: "Node Dependensi",
    nav_servers: "Server Virtual",
    nav_server_mgt: "CLI & Server Node",
    nav_hosting_mgt: "Ruang Hosting",
    nav_support: "Dukungan Tiket",
    nav_billing: "Portal Tagihan",
    nav_settings: "Pengaturan Sistem",
    nav_profile: "Profil Saya",
    nav_users: "Manajemen User",
    nav_audit: "Audit Log Aktivitas",
    nav_ssh_term: "Terminal SSH",

    title_overview: "Ikhtisar Analisis Mesin Inti",
    title_processes: "Tabel Proses Sistem Operasi Langsung",
    title_shell: "Konsol Terminal Administratif Aman",
    title_system: "Spesifikasi Perangkat Keras Sistem Lengkap",
    title_files: "Penjelajah & Editor File Sistem Operasi Langsung",
    title_npm: "Grafik Dependensi Node Ruang Kerja Otomatis",
    title_servers: "Manajer Layanan Web / Server Virtual Host",
    title_server_mgt: "Manajemen Server Node & CLI",
    title_hosting_mgt: "Manajemen Hosting & File Workspace",
    title_support: "Portal Bantuan Teknis Pelanggan 24/7",
    title_billing: "Portal Tagihan & Paket Langganan",
    title_settings: "Pengaturan Administrator Sistem",
    title_profile: "Detail Profil Akun Pengguna",
    title_users: "Manajemen User Administrasi",
    title_audit: "Pemantauan Log Audit Keamanan",
    title_ssh_term: "Konsol Terminal SSH Berbasis Browser",

    uptime: "WAKTU AKTIF",
    active_server: "Node Server Aktif",
    syslogs_alerts: "Pemberitahuan Panel & Log",
    clear: "Bersihkan",
    sign_out: "Keluar Sesi",
    server_state: "Status Server",
    online: "ONLINE",

    save: "Simpan Perubahan",
    cancel: "Batal",
    delete: "Hapus",
    add: "Tambah Baru",
    edit: "Ubah Profil",
    search: "Cari kueri...",
    actions: "Tindakan",
    status: "Status",
    back_to_dashboard: "Kembali ke Dashboard",
    copy_output: "Salin Output",
    clear_text: "Bersihkan",

    auth_success: "Autentikasi berhasil: Selamat datang kembali!",
    auth_failed: "Autentikasi gagal. periksa kembali kredensial Anda.",
    log_out_success: "Selesai! Sesi aman Anda telah ditutup."
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aye_panel_lang');
    if (saved === 'en' || saved === 'id') return saved;
    return 'en'; // default English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aye_panel_lang', lang);
  };

  const t = (key: keyof Translations): string => {
    const translation = dictionaries[language][key];
    if (translation === undefined) {
      // Fallback
      return dictionaries['en'][key] || String(key);
    }
    return translation;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
