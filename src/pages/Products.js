import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addProduct, updateProduct, deleteProduct, CATEGORIES } from '../utils/store';
import { Btn, Input, Select, Modal, Badge, Card, SearchBar, ConfirmDialog, Empty, Alert } from '../components/UI';
import { formatKES } from '../utils/format';

const EMPTY_FORM = { name: '', category: 'Gaming', price: '', stock: '', sku: '', lowStockAlert: 5 };

export default function Products() {
  const { products, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || p.category === filterCat;
    return matchSearch && matchCat && p.active !== false;
  });

  const handleOpen = (product = null) => {
    if (product) {
      setEditProduct(product);
      setForm({ name: product.name, category: product.category, price: product.price, stock: product.stock, sku: product.sku || '', lowStockAlert: product.lowStockAlert || 5 });
    } else {
      setEditProduct(null);
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter valid price';
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0) e.stock = 'Enter valid stock';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;
    const data = { ...form, price: Number(form.price), stock: Number(form.stock), lowStockAlert: Number(form.lowStockAlert) };
    setSaving(true);
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data);
        showToast('Product updated');
      } else {
        await addProduct(data);
        showToast('Product added');
      }
      await refresh();
      setShowModal(false);
    } catch (e) {
      showToast(e?.message || 'Could not save product', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async (id) => {
    try {
      await deleteProduct(id);
      await refresh();
      showToast('Product deleted', 'danger');
    } catch (e) {
      showToast(e?.message || 'Could not delete product', 'danger');
    }
  };

  const catOptions = [{ value: 'All', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))];

  const stockStatus = (p) => {
    if (p.stock === 0) return <Badge variant="danger">Out of stock</Badge>;
    if (p.stock <= p.lowStockAlert) return <Badge variant="warning"><AlertTriangle size={11} /> Low</Badge>;
    return <Badge variant="success">{p.stock} in stock</Badge>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999 }}>
          <Alert type={toast.type === 'danger' ? 'danger' : 'success'} onClose={() => setToast(null)}>{toast.msg}</Alert>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Products</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{products.filter(p => p.active !== false).length} products total</p>
        </div>
        <Btn onClick={() => handleOpen()} icon={<Plus size={16} />}><Plus size={16} />Add Product</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…" style={{ flex: 1, minWidth: 200 }} />
        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} options={catOptions} style={{ width: 180 }} />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 13, whiteSpace: 'nowrap',
            border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)',
            background: filterCat === cat ? 'var(--teal)' : 'var(--white)',
            color: filterCat === cat ? '#fff' : 'var(--text-secondary)',
            borderColor: filterCat === cat ? 'var(--teal)' : 'var(--border)',
          }}>{cat}</button>
        ))}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <Empty icon={<Package size={40} />} title="No products found" description="Try a different search or category" action={<Btn onClick={() => handleOpen()}><Plus size={16} />Add Product</Btn>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(p => (
            <Card key={p.id} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku || '—'}</p>
                </div>
                <Badge variant="info">{p.category}</Badge>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--teal-dark)', marginBottom: 10 }}>{formatKES(p.price)}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {stockStatus(p)}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleOpen(p)} style={{
                    padding: '6px', background: 'var(--surface-2)', border: 'none',
                    borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)'
                  }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    padding: '6px', background: 'var(--danger-bg)', border: 'none',
                    borderRadius: 6, cursor: 'pointer', color: 'var(--danger)'
                  }}><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'}
        footer={<><Btn variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : (editProduct ? 'Save Changes' : 'Add Product')}</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Product Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. iPhone 15 Pro Max" required error={errors.name} />
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Price (KES)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" required min={0} error={errors.price} />
            <Input label="Stock Qty" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" required min={0} error={errors.stock} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="SKU (optional)" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. PHN-001" />
            <Input label="Low Stock Alert at" type="number" value={form.lowStockAlert} onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} min={0} hint="Alert when stock ≤ this" />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => confirmDelete(deleteId)}
        title="Delete Product" message="This will permanently delete this product. This action cannot be undone." />
    </div>
  );
}
