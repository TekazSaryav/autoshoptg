import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, 
  Settings, LogOut, Plus, Pencil, Trash2, Search, RefreshCw,
  TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Truck,
  ChevronRight, Menu, X, Eye, AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_KEY = process.env.REACT_APP_API_KEY || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' }
});

// Format price
const formatPrice = (cents, currency = 'EUR') => {
  return `${(cents / 100).toFixed(2)} ${currency}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Status badge
const StatusBadge = ({ status, type = 'order' }) => {
  const orderColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    canceled: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  
  const ticketColors = {
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  
  const colors = type === 'ticket' ? ticketColors : orderColors;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// Stat Card
const StatCard = ({ icon: Icon, label, value, subValue, color = 'gold' }) => {
  const colors = {
    gold: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 animate-fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-patek-muted" />
        <span className="text-xs text-patek-muted">{subValue}</span>
      </div>
      <div className="text-2xl font-bold text-patek-text">{value}</div>
      <div className="text-sm text-patek-muted mt-1">{label}</div>
    </div>
  );
};

// Modal
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-patek-card border border-patek-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-patek-border">
          <h3 className="text-lg font-semibold text-patek-text">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-patek-border rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats }) => {
  return (
    <div className="space-y-6" data-testid="dashboard-view">
      <div>
        <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Tableau de bord</h2>
        <p className="text-patek-muted">Vue d'ensemble de votre boutique</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats?.users || 0} subValue="Total" color="blue" />
        <StatCard icon={Package} label="Produits" value={stats?.products || 0} subValue="Actifs" color="purple" />
        <StatCard icon={ShoppingCart} label="Commandes" value={stats?.orders?.total || 0} subValue="Total" color="gold" />
        <StatCard icon={MessageSquare} label="Tickets" value={stats?.tickets?.open || 0} subValue="Ouverts" color="green" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-patek-card border border-patek-border rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">Commandes par statut</h3>
          <div className="space-y-3">
            {['pending', 'paid', 'preparing', 'shipped', 'completed', 'canceled'].map(status => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-patek-text font-medium">{stats?.orders?.[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-patek-card border border-patek-border rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">Tickets support</h3>
          <div className="space-y-3">
            {['open', 'in_progress', 'resolved'].map(status => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} type="ticket" />
                <span className="text-patek-text font-medium">{stats?.tickets?.[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Categories Component
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ slug: '', name: '', description: '', icon: '📁', position: 0 });
  
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.patch(`/api/admin/categories/${editingCategory.id}`, formData);
      } else {
        await api.post('/api/admin/categories', formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ slug: '', name: '', description: '', icon: '📁', position: 0 });
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };
  
  const openEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ slug: cat.slug, name: cat.name, description: cat.description || '', icon: cat.icon || '📁', position: cat.position || 0 });
    setShowModal(true);
  };
  
  return (
    <div className="space-y-6" data-testid="categories-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Catégories</h2>
          <p className="text-patek-muted">{categories.length} catégories</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setFormData({ slug: '', name: '', description: '', icon: '📁', position: 0 }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-patek-accent text-black font-medium rounded-lg hover:bg-patek-accent-light transition-colors"
          data-testid="add-category-btn"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-patek-accent" /></div>
      ) : (
        <div className="bg-patek-card border border-patek-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-patek-darker">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Icône</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-patek-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patek-border">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-patek-darker/50 transition-colors">
                  <td className="px-4 py-3 text-2xl">{cat.icon || '📁'}</td>
                  <td className="px-4 py-3 font-medium text-patek-text">{cat.name}</td>
                  <td className="px-4 py-3 text-patek-muted">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${cat.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {cat.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-patek-border rounded-lg transition-colors" data-testid={`edit-category-${cat.id}`}>
                        <Pencil className="w-4 h-4 text-patek-muted" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" data-testid={`delete-category-${cat.id}`}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Nom</label>
            <input 
              type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              required data-testid="category-name-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Slug</label>
            <input 
              type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              required data-testid="category-slug-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Icône (emoji)</label>
            <input 
              type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              data-testid="category-icon-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Description</label>
            <textarea 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              rows={3} data-testid="category-description-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-patek-muted hover:text-patek-text transition-colors">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-patek-accent text-black font-medium rounded-lg hover:bg-patek-accent-light transition-colors" data-testid="save-category-btn">
              {editingCategory ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Products Component
const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ category_id: '', sku: '', title: '', description: '', price_cents: 0, stock: 0, image_urls: [] });
  
  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/admin/products'),
        api.get('/api/admin/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.patch(`/api/admin/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/api/admin/products', formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };
  
  const openEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      category_id: prod.category_id,
      sku: prod.sku,
      title: prod.title,
      description: prod.description,
      price_cents: prod.price_cents,
      stock: prod.stock,
      image_urls: prod.images?.map(i => i.url) || []
    });
    setShowModal(true);
  };
  
  const openCreate = () => {
    setEditingProduct(null);
    setFormData({ category_id: categories[0]?.id || '', sku: '', title: '', description: '', price_cents: 0, stock: 0, image_urls: [] });
    setShowModal(true);
  };
  
  return (
    <div className="space-y-6" data-testid="products-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Produits</h2>
          <p className="text-patek-muted">{products.length} produits</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-patek-accent text-black font-medium rounded-lg hover:bg-patek-accent-light transition-colors" data-testid="add-product-btn">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-patek-accent" /></div>
      ) : (
        <div className="bg-patek-card border border-patek-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-patek-darker">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Prix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-patek-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patek-border">
              {products.map(prod => (
                <tr key={prod.id} className="hover:bg-patek-darker/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {prod.images?.[0]?.url ? (
                        <img src={prod.images[0].url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-patek-darker rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-patek-muted" />
                        </div>
                      )}
                      <span className="font-medium text-patek-text">{prod.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-patek-muted font-mono text-sm">{prod.sku}</td>
                  <td className="px-4 py-3 text-patek-accent font-medium">{formatPrice(prod.price_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${prod.stock > 10 ? 'text-green-400' : prod.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {prod.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${prod.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {prod.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(prod)} className="p-1.5 hover:bg-patek-border rounded-lg transition-colors" data-testid={`edit-product-${prod.id}`}>
                        <Pencil className="w-4 h-4 text-patek-muted" />
                      </button>
                      <button onClick={() => handleDelete(prod.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" data-testid={`delete-product-${prod.id}`}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Catégorie</label>
            <select 
              value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              required data-testid="product-category-select"
            >
              <option value="">Sélectionner...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-patek-muted mb-1">SKU</label>
              <input 
                type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                required data-testid="product-sku-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-patek-muted mb-1">Titre</label>
              <input 
                type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                required data-testid="product-title-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">Description</label>
            <textarea 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              rows={3} required data-testid="product-description-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-patek-muted mb-1">Prix (centimes)</label>
              <input 
                type="number" value={formData.price_cents} onChange={e => setFormData({...formData, price_cents: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                required min="0" data-testid="product-price-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-patek-muted mb-1">Stock</label>
              <input 
                type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                required min="0" data-testid="product-stock-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-patek-muted mb-1">URL Image (optionnel)</label>
            <input 
              type="url" 
              value={formData.image_urls?.[0] || ''} 
              onChange={e => setFormData({...formData, image_urls: e.target.value ? [e.target.value] : []})}
              className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
              placeholder="https://..." data-testid="product-image-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-patek-muted hover:text-patek-text transition-colors">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-patek-accent text-black font-medium rounded-lg hover:bg-patek-accent-light transition-colors" data-testid="save-product-btn">
              {editingProduct ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Orders Component
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) { fetchOrders(); return; }
    try {
      const { data } = await api.get(`/api/admin/orders/search/${searchQuery}`);
      if (data) setOrders([data]);
      else setOrders([]);
    } catch (err) {
      setOrders([]);
    }
  };
  
  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };
  
  const statusOptions = ['pending', 'paid', 'preparing', 'shipped', 'completed', 'canceled'];
  
  return (
    <div className="space-y-6" data-testid="orders-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Commandes</h2>
          <p className="text-patek-muted">{orders.length} commandes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-patek-muted" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="N° commande..."
              className="pl-10 pr-4 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none w-48"
              data-testid="search-order-input"
            />
          </div>
          <button onClick={handleSearch} className="p-2 bg-patek-accent text-black rounded-lg hover:bg-patek-accent-light transition-colors" data-testid="search-order-btn">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={fetchOrders} className="p-2 bg-patek-darker border border-patek-border rounded-lg hover:bg-patek-border transition-colors" data-testid="refresh-orders-btn">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-patek-accent" /></div>
      ) : (
        <div className="bg-patek-card border border-patek-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-patek-darker">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">N° Commande</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-patek-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patek-border">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-patek-darker/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-patek-accent">{order.order_number}</td>
                  <td className="px-4 py-3 text-patek-muted text-sm">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 text-patek-text font-medium">{formatPrice(order.total_cents)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-patek-border rounded-lg transition-colors" data-testid={`view-order-${order.id}`}>
                        <Eye className="w-4 h-4 text-patek-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Commande ${selectedOrder?.order_number}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-patek-muted">Date</label>
                <p className="text-patek-text">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <label className="text-sm text-patek-muted">Total</label>
                <p className="text-patek-accent font-bold">{formatPrice(selectedOrder.total_cents)}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-patek-muted block mb-2">Statut</label>
              <select 
                value={selectedOrder.status}
                onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                data-testid="order-status-select"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-sm text-patek-muted block mb-2">Articles</label>
              <div className="space-y-2">
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-patek-darker rounded-lg">
                    <span className="text-patek-text">{item.title} x{item.quantity}</span>
                    <span className="text-patek-accent">{formatPrice(item.total_price_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Users Component
const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  
  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role });
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };
  
  const roleColors = {
    admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    client: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  
  return (
    <div className="space-y-6" data-testid="users-view">
      <div>
        <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Utilisateurs</h2>
        <p className="text-patek-muted">{users.length} utilisateurs</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-patek-accent" /></div>
      ) : (
        <div className="bg-patek-card border border-patek-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-patek-darker">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Telegram ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Inscrit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patek-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-patek-darker/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-patek-text">{user.first_name} {user.last_name || ''}</div>
                      <div className="text-sm text-patek-muted">@{user.username || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-patek-muted">{user.telegram_id}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded border bg-transparent ${roleColors[user.role] || roleColors.client}`}
                      data-testid={`user-role-${user.id}`}
                    >
                      <option value="client">client</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-patek-muted text-sm">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Tickets Component
const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/tickets');
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  
  const updateStatus = async (ticketId, status) => {
    try {
      await api.patch(`/api/admin/tickets/${ticketId}/status?status=${status}`);
      fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };
  
  return (
    <div className="space-y-6" data-testid="tickets-view">
      <div>
        <h2 className="text-2xl font-display font-bold text-patek-text mb-1">Tickets Support</h2>
        <p className="text-patek-muted">{tickets.length} tickets</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-patek-accent" /></div>
      ) : (
        <div className="bg-patek-card border border-patek-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-patek-darker">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Sujet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-patek-muted uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-patek-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patek-border">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-patek-darker/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-patek-text">{ticket.subject}</td>
                  <td className="px-4 py-3 text-patek-muted text-sm">{formatDate(ticket.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} type="ticket" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedTicket(ticket)} className="p-1.5 hover:bg-patek-border rounded-lg transition-colors" data-testid={`view-ticket-${ticket.id}`}>
                        <Eye className="w-4 h-4 text-patek-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={selectedTicket?.subject}>
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-patek-muted block mb-2">Statut</label>
              <select 
                value={selectedTicket.status}
                onChange={e => { updateStatus(selectedTicket.id, e.target.value); setSelectedTicket({...selectedTicket, status: e.target.value}); }}
                className="w-full px-3 py-2 bg-patek-darker border border-patek-border rounded-lg text-patek-text focus:border-patek-accent focus:outline-none"
                data-testid="ticket-status-select"
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-patek-muted block mb-2">Messages</label>
              <div className="space-y-2 max-h-60 overflow-auto">
                {selectedTicket.messages?.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${msg.from === 'user' ? 'bg-patek-darker' : 'bg-patek-accent/10 border border-patek-accent/20'}`}>
                    <div className="flex justify-between text-xs text-patek-muted mb-1">
                      <span>{msg.from === 'user' ? 'Client' : 'Staff'}</span>
                      <span>{msg.at}</span>
                    </div>
                    <p className="text-patek-text text-sm">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Main App
function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  const seedData = async () => {
    if (!window.confirm('Créer les données de démonstration ?')) return;
    try {
      await api.post('/api/admin/seed');
      window.location.reload();
    } catch (err) {
      console.error('Error seeding:', err);
    }
  };
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'categories', icon: Package, label: 'Catégories' },
    { id: 'products', icon: ShoppingCart, label: 'Produits' },
    { id: 'orders', icon: Truck, label: 'Commandes' },
    { id: 'users', icon: Users, label: 'Utilisateurs' },
    { id: 'tickets', icon: MessageSquare, label: 'Support' },
  ];
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'categories': return <Categories />;
      case 'products': return <Products />;
      case 'orders': return <Orders />;
      case 'users': return <UsersView />;
      case 'tickets': return <Tickets />;
      default: return <Dashboard stats={stats} />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-patek-dark flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-patek-accent" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-patek-dark flex" data-testid="admin-panel">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-patek-darker border-r border-patek-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-patek-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-patek-accent to-amber-600 rounded-xl flex items-center justify-center text-black font-bold">
              P
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-display font-bold text-patek-text">Patek Shop</h1>
                <p className="text-xs text-patek-muted">Admin Panel</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                currentView === item.id 
                  ? 'bg-patek-accent/10 text-patek-accent border border-patek-accent/20' 
                  : 'text-patek-muted hover:bg-patek-border hover:text-patek-text'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-3 border-t border-patek-border space-y-1">
          <button 
            onClick={seedData}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-patek-muted hover:bg-patek-border hover:text-patek-text transition-all"
            data-testid="seed-data-btn"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Seed Data</span>}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-patek-muted hover:bg-patek-border hover:text-patek-text transition-all"
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Réduire</span>}
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
