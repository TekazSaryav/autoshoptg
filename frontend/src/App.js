import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// Telegram WebApp SDK
const tg = window.Telegram?.WebApp;

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Create API instance with Telegram auth
const createApi = () => {
  const initData = tg?.initData || 'demo';  // Fallback to demo mode
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData
    }
  });
};

// Icons
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const ShopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// Format price
const formatPrice = (cents) => `${(cents / 100).toFixed(2)} €`;

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

// Bottom Navigation
const BottomNav = ({ currentView, setCurrentView, cartCount }) => (
  <nav className="bottom-nav">
    {[
      { id: 'home', icon: HomeIcon, label: 'Accueil' },
      { id: 'deposit', icon: WalletIcon, label: 'Dépôt' },
      { id: 'shop', icon: ShopIcon, label: 'Boutique' },
      { id: 'support', icon: SupportIcon, label: 'Support' },
      { id: 'settings', icon: SettingsIcon, label: 'Réglages' },
    ].map(item => (
      <div
        key={item.id}
        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
        onClick={() => setCurrentView(item.id)}
        data-testid={`nav-${item.id}`}
      >
        <item.icon />
        <span>{item.label}</span>
        {item.id === 'shop' && cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '12px',
            background: 'var(--accent)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: '600'
          }}>{cartCount}</span>
        )}
      </div>
    ))}
  </nav>
);

// Home Page
const HomePage = ({ user, categories, productsCount, onCategoryClick, setCurrentView }) => (
  <div className="page-container animate-fade-in">
    {/* Header */}
    <div className="header">
      <div className="header-avatar">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span>{user?.first_name?.[0] || '👤'}</span>
        )}
      </div>
      <div>
        <div style={{ fontWeight: '600' }}>Bonjour</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.first_name || 'Utilisateur'}</div>
      </div>
    </div>

    {/* Balance Card */}
    <div className="balance-card" data-testid="balance-card">
      <div className="balance-label">Solde disponible</div>
      <div className="balance-value">{formatPrice(user?.balance_cents || 0)}</div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button className="btn-primary" onClick={() => setCurrentView('shop')} data-testid="shop-btn">
          🛒 Boutique
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentView('deposit')} data-testid="deposit-btn">
          💳 Déposer
        </button>
      </div>
    </div>

    {/* Products Available */}
    <div style={{ padding: '0 16px', marginBottom: '16px' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setCurrentView('shop')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📦</span>
          <span style={{ fontWeight: '500' }}>Produits disponibles</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '20px' }}>{productsCount}</span>
          <ChevronRight />
        </div>
      </div>
    </div>

    {/* Categories Preview */}
    {categories && categories.length > 0 && (
      <div style={{ padding: '0 16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Catégories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {categories.slice(0, 4).map(cat => (
            <div key={cat.id} className="category-card" onClick={() => onCategoryClick(cat.id)} data-testid={`category-${cat.id}`}>
              <div className="category-icon">{cat.icon || '📁'}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-count">{cat.count || 0} produits</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Deposit Page
const DepositPage = ({ depositInfo, onCopy }) => (
  <div className="page-container animate-fade-in">
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Recharger ma balance</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Ton solde est crédité en EUR stable
      </p>

      {/* Bitcoin */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f7931a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px' }}>₿</span>
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>Bitcoin</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>BTC</div>
          </div>
        </div>
        <div className="crypto-address" onClick={() => onCopy(depositInfo?.btc_address)} style={{ cursor: 'pointer' }}>
          {depositInfo?.btc_address || 'Chargement...'}
        </div>
        <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => onCopy(depositInfo?.btc_address)} data-testid="copy-btc">
          Copier l'adresse
        </button>
      </div>

      {/* Litecoin */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#bfbbbb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px' }}>Ł</span>
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>Litecoin</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LTC</div>
          </div>
        </div>
        <div className="crypto-address" onClick={() => onCopy(depositInfo?.ltc_address)} style={{ cursor: 'pointer' }}>
          {depositInfo?.ltc_address || 'Chargement...'}
        </div>
        <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => onCopy(depositInfo?.ltc_address)} data-testid="copy-ltc">
          Copier l'adresse
        </button>
      </div>

      <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '12px', padding: '12px', marginTop: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          ⚠️ Après envoi, contactez le support avec la preuve de transaction pour créditer votre compte.
        </p>
      </div>
    </div>
  </div>
);

// Shop Page
const ShopPage = ({ categories, onCategoryClick }) => (
  <div className="page-container animate-fade-in">
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Boutique</h2>
      
      {categories && categories.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {categories.map(cat => (
            <div key={cat.id} className="category-card" onClick={() => onCategoryClick(cat.id)} data-testid={`shop-category-${cat.id}`}>
              <div className="category-icon">{cat.icon || '📁'}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-count">{cat.products_count || 0} produits</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageIcon />
          <p>Aucune catégorie disponible</p>
        </div>
      )}
    </div>
  </div>
);

// Category Products Page
const CategoryPage = ({ category, products, onBack, onProductClick, onAddToCart }) => (
  <div className="page-container animate-fade-in">
    <div className="header" style={{ cursor: 'pointer' }} onClick={onBack}>
      <BackIcon />
      <div style={{ fontWeight: '600' }}>{category?.name || 'Catégorie'}</div>
    </div>
    
    <div style={{ padding: '16px' }}>
      {products && products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {products.map(product => (
            <div key={product.id} className="product-card" onClick={() => onProductClick(product)} data-testid={`product-${product.id}`}>
              {product.images?.[0]?.url ? (
                <img src={product.images[0].url} alt="" className="product-image" />
              ) : (
                <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageIcon />
                </div>
              )}
              <div className="product-info">
                <div className="product-title">{product.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div className="product-price">{formatPrice(product.price_cents)}</div>
                  {product.stock > 0 ? (
                    <span className="badge badge-success">En stock</span>
                  ) : (
                    <span className="badge badge-error">Épuisé</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageIcon />
          <p>Aucun produit dans cette catégorie</p>
        </div>
      )}
    </div>
  </div>
);

// Product Detail Modal
const ProductModal = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 style={{ fontWeight: '600' }}>{product.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <CloseIcon />
          </button>
        </div>
        
        <div style={{ padding: '16px' }}>
          {product.images?.[0]?.url && (
            <img src={product.images[0].url} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
          )}
          
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
            {formatPrice(product.price_cents)}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {product.stock > 0 ? (
              <span className="badge badge-success">✓ En stock ({product.stock})</span>
            ) : (
              <span className="badge badge-error">Épuisé</span>
            )}
            <span className="badge badge-info">SKU: {product.sku}</span>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            {product.description}
          </p>
          
          {product.stock > 0 && (
            <button className="btn-primary" onClick={() => onAddToCart(product.id)} data-testid="add-to-cart-btn">
              Ajouter au panier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Cart Modal
const CartModal = ({ cart, userBalance, onClose, onUpdateQuantity, onCheckout }) => {
  const total = cart?.items?.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0) || 0;
  const canCheckout = total > 0 && userBalance >= total;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 style={{ fontWeight: '600' }}>Mon Panier</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <CloseIcon />
          </button>
        </div>
        
        <div style={{ padding: '16px' }}>
          {cart?.items?.length > 0 ? (
            <>
              {cart.items.map(item => (
                <div key={item.id} className="card" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.product_title}</div>
                    <div style={{ color: 'var(--accent)', fontWeight: '600' }}>{formatPrice(item.unit_price_cents)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <MinusIcon />
                    </button>
                    <span style={{ fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              ))}
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--accent)' }}>{formatPrice(total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Votre solde</span>
                  <span style={{ fontWeight: '500' }}>{formatPrice(userBalance)}</span>
                </div>
                
                {!canCheckout && total > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--accent)' }}>
                    Solde insuffisant. Rechargez votre compte.
                  </div>
                )}
                
                <button className="btn-primary" onClick={onCheckout} disabled={!canCheckout} style={{ opacity: canCheckout ? 1 : 0.5 }} data-testid="checkout-btn">
                  Valider la commande
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ShopIcon />
              <p>Votre panier est vide</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Support Page
const SupportPage = ({ tickets, onNewTicket, onTicketClick }) => (
  <div className="page-container animate-fade-in">
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Support</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nous sommes là pour vous aider</p>
        </div>
      </div>
      
      <button className="btn-primary" onClick={onNewTicket} style={{ marginBottom: '24px' }} data-testid="new-ticket-btn">
        + Nouveau ticket
      </button>
      
      {tickets && tickets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-item" onClick={() => onTicketClick(ticket)} data-testid={`ticket-${ticket.id}`}>
              <div className="ticket-icon">
                <SupportIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(ticket.created_at)}</div>
              </div>
              <span className={`badge ${ticket.status === 'open' ? 'badge-success' : ticket.status === 'resolved' ? 'badge-info' : 'badge-warning'}`}>
                {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'resolved' ? 'Résolu' : 'En cours'}
              </span>
              <ChevronRight />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SupportIcon />
          <p>Aucun ticket</p>
        </div>
      )}
    </div>
  </div>
);

// New Ticket Modal
const NewTicketModal = ({ onClose, onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = () => {
    if (subject.trim() && message.trim()) {
      onSubmit(subject, message);
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 style={{ fontWeight: '600' }}>Nouveau ticket</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <CloseIcon />
          </button>
        </div>
        
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Sujet</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="Ex: Problème de paiement"
              data-testid="ticket-subject-input"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Message</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Décrivez votre problème..."
              rows={4}
              data-testid="ticket-message-input"
            />
          </div>
          <button className="btn-primary" onClick={handleSubmit} data-testid="submit-ticket-btn">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage = ({ user, orders }) => (
  <div className="page-container animate-fade-in">
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Réglages</h2>
      
      {/* Profile */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            {user?.first_name?.[0] || '👤'}
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>{user?.first_name} {user?.last_name || ''}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{user?.username || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {/* Balance */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Solde</span>
          <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '18px' }}>{formatPrice(user?.balance_cents || 0)}</span>
        </div>
      </div>
      
      {/* Orders */}
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px' }}>Mes commandes</h3>
      {orders && orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => (
            <div key={order.id} className="card" data-testid={`order-${order.id}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>{order.order_number}</span>
                <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'paid' ? 'badge-info' : order.status === 'canceled' ? 'badge-error' : 'badge-warning'}`}>
                  {order.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(order.created_at)}</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '24px' }}>
          <p>Aucune commande</p>
        </div>
      )}
    </div>
  </div>
);

// Main App
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [depositInfo, setDepositInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const api = createApi();

  // Initialize Telegram WebApp
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0d0d12');
      tg.setBackgroundColor('#0d0d12');
    }
  }, []);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copié !');
    } catch {
      showToast('Erreur de copie', 'error');
    }
  };

  // Fetch home data
  const fetchHomeData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/home');
      setUser(data.user);
      setCategories(data.categories);
      setProductsCount(data.products_count);
    } catch (err) {
      console.error('Error fetching home:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch deposit info
  const fetchDepositInfo = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/deposit');
      setDepositInfo(data);
    } catch (err) {
      console.error('Error fetching deposit:', err);
    }
  }, []);

  // Fetch shop categories
  const fetchShopCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch category products
  const fetchCategoryProducts = useCallback(async (catId) => {
    try {
      const { data } = await api.get(`/api/webapp/categories/${catId}/products`);
      setSelectedCategory(data.category);
      setCategoryProducts(data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/cart');
      setCart(data.cart);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/tickets');
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/api/webapp/orders');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHomeData();
    fetchCart();
  }, [fetchHomeData, fetchCart]);

  // Load data based on view
  useEffect(() => {
    if (currentView === 'deposit') fetchDepositInfo();
    if (currentView === 'shop') fetchShopCategories();
    if (currentView === 'support') fetchTickets();
    if (currentView === 'settings') fetchOrders();
  }, [currentView, fetchDepositInfo, fetchShopCategories, fetchTickets, fetchOrders]);

  // Handle category click
  const handleCategoryClick = (catId) => {
    fetchCategoryProducts(catId);
    setCurrentView('category');
  };

  // Add to cart
  const handleAddToCart = async (productId) => {
    try {
      await api.post(`/api/webapp/cart/add?product_id=${productId}&quantity=1`);
      await fetchCart();
      setSelectedProduct(null);
      showToast('Ajouté au panier');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Erreur', 'error');
    }
  };

  // Update cart quantity
  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      await api.post(`/api/webapp/cart/update?item_id=${itemId}&quantity=${quantity}`);
      await fetchCart();
    } catch (err) {
      showToast('Erreur de mise à jour', 'error');
    }
  };

  // Checkout
  const handleCheckout = async () => {
    try {
      await api.post('/api/webapp/checkout');
      await fetchCart();
      await fetchHomeData();
      setShowCart(false);
      showToast('Commande validée !');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Erreur de paiement', 'error');
    }
  };

  // Create ticket
  const handleCreateTicket = async (subject, message) => {
    try {
      await api.post(`/api/webapp/tickets?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`);
      await fetchTickets();
      setShowNewTicket(false);
      showToast('Ticket créé');
    } catch (err) {
      showToast('Erreur', 'error');
    }
  };

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: 'var(--accent)', fontSize: '24px' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }} data-testid="mini-app">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'var(--accent)' : 'var(--success)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          zIndex: 1000,
          fontWeight: '500',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* Main content */}
      {currentView === 'home' && (
        <HomePage 
          user={user} 
          categories={categories} 
          productsCount={productsCount}
          onCategoryClick={handleCategoryClick}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === 'deposit' && (
        <DepositPage depositInfo={depositInfo} onCopy={copyToClipboard} />
      )}
      {currentView === 'shop' && (
        <ShopPage categories={categories} onCategoryClick={handleCategoryClick} />
      )}
      {currentView === 'category' && (
        <CategoryPage 
          category={selectedCategory}
          products={categoryProducts}
          onBack={() => setCurrentView('shop')}
          onProductClick={setSelectedProduct}
          onAddToCart={handleAddToCart}
        />
      )}
      {currentView === 'support' && (
        <SupportPage 
          tickets={tickets}
          onNewTicket={() => setShowNewTicket(true)}
          onTicketClick={(ticket) => console.log('Ticket:', ticket)}
        />
      )}
      {currentView === 'settings' && (
        <SettingsPage user={user} orders={orders} />
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
      {showCart && (
        <CartModal 
          cart={cart}
          userBalance={user?.balance_cents || 0}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      )}
      {showNewTicket && (
        <NewTicketModal 
          onClose={() => setShowNewTicket(false)}
          onSubmit={handleCreateTicket}
        />
      )}

      {/* Floating cart button */}
      {cartCount > 0 && currentView !== 'settings' && (
        <button
          onClick={() => setShowCart(true)}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '16px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--accent)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
            zIndex: 50
          }}
          data-testid="cart-fab"
        >
          <ShopIcon />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'white',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>{cartCount}</span>
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        currentView={currentView} 
        setCurrentView={(view) => {
          if (view !== 'category') setCurrentView(view);
        }}
        cartCount={cartCount}
      />
    </div>
  );
}

export default App;
