'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft, Image as ImageIcon, Box, FileText, CheckCircle2, Star, List, Plus, Trash2, Upload } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ProductFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
}

const SECTIONS = [
    { id: 'Шинэ', label: 'Шинэ' },
    { id: 'Бэлэн', label: 'Бэлэн' },
    { id: 'Захиалга', label: 'Захиалга' },
    { id: 'Хямдрал', label: 'Хямдрал' },
];

export default function ProductForm({ initialData, onSubmit, isSubmitting }: ProductFormProps) {
    const router = useRouter();
    const { data: categoriesData } = useSWR('/api/categories', fetcher);

    const categories = categoriesData?.categories || [];

    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        originalPrice: initialData?.originalPrice?.toString() || '',
        discountPercent: initialData?.discountPercent?.toString() || '',
        sections: initialData?.sections || [],
        image: initialData?.image || '',
        images: initialData?.images || [],
        category: initialData?.category || '',
        stockStatus: initialData?.stockStatus || 'in-stock',
        inventory: initialData?.inventory?.toString() || '0',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        delivery: initialData?.delivery || 'Үнэгүй',
        paymentMethods: initialData?.paymentMethods || 'QPay, SocialPay, Card',
        featured: initialData?.featured || false,
        attributes: initialData?.attributes || {}
    });

    const [attributeRows, setAttributeRows] = useState<{ key: string, value: string }[]>(
        initialData?.attributes
            ? Object.entries(initialData.attributes).map(([k, v]) => ({ key: k, value: String(v) }))
            : []
    );

    useEffect(() => {
        if (!formData.category && categories.length > 0) {
            setFormData(prev => ({ ...prev, category: categories[0].id }));
        }
    }, [categories, formData.category]);

    // Handle Sale Price Auto-calculation
    const showDiscountFields = formData.sections.includes('Хямдрал');
    useEffect(() => {
        if (showDiscountFields) {
            const op = parseFloat(formData.originalPrice);
            const dp = parseFloat(formData.discountPercent);
            if (!isNaN(op) && !isNaN(dp)) {
                const salePrice = Math.round((op * (1 - dp / 100)) / 10) * 10;
                if (String(salePrice) !== formData.price) {
                    setFormData(prev => ({ ...prev, price: String(salePrice) }));
                }
            }
        }
    }, [formData.originalPrice, formData.discountPercent, showDiscountFields, formData.price]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: typeof value === 'function' ? value(prev[field as keyof typeof prev]) : value
        }));
    };

    const toggleSection = (sectionId: string) => {
        const sections = formData.sections.includes(sectionId)
            ? formData.sections.filter((s: string) => s !== sectionId)
            : [...formData.sections, sectionId];
        handleChange('sections', sections);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.category) {
            toast.error('Шаардлагатай талбаруудыг бөглөнө үү (Нэр, Үнэ, Ангилал)');
            return;
        }

        // Convert attribute rows back to object
        const attributesObj: Record<string, string> = {};
        attributeRows.forEach(row => {
            if (row.key.trim()) {
                attributesObj[row.key.trim()] = row.value;
            }
        });

        const submitData = {
            ...formData,
            attributes: attributesObj,
        };

        await onSubmit(submitData);
    };

    const tabs = [
        { id: 'basic', label: 'Ерөнхий', icon: FileText },
        { id: 'media', label: 'Зураг', icon: ImageIcon },
        { id: 'attributes', label: 'Шинж чанар', icon: List },
        { id: 'pricing', label: 'Үнэ & Үлдэгдэл', icon: Box },
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 h-full pb-20">
            {/* Main Content Area - Left Column */}
            <div className="flex-1 space-y-6">

                {/* Desktop Tabs Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 hidden sm:flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Mobile Tabs Header (Scrollable) */}
                <div className="sm:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-amber-500 text-slate-950 shadow-md transform scale-105'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Boxes */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Барааны Нэр <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                                    placeholder="Жишээ нь: Apple iPhone 15 Pro Max"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Дэлгэрэнгүй Тайлабар</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={5}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm resize-none"
                                    placeholder="Барааны тухай дэлгэрэнгүй мэдээлэл..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Брэнд</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => handleChange('brand', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm"
                                        placeholder="Apple, Samsung гэх мэт"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Модель / Загвар</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm"
                                        placeholder="iPhone 15 Pro Max"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Main Image */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Үндсэн Зураг <span className="text-red-500">*</span></label>
                                <div className="space-y-4">
                                    {formData.image && (
                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                                            <img src={formData.image} alt="Main" className="w-full h-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {!formData.image && (
                                        <CldUploadWidget
                                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                                            onSuccess={(result: any) => {
                                                const url = result?.info?.secure_url;
                                                if (url) {
                                                    setFormData(prev => ({ ...prev, image: url }));
                                                }
                                            }}
                                        >
                                            {({ open }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => open()}
                                                    className="w-full py-12 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                                                >
                                                    <div className="p-4 bg-slate-900 rounded-full group-hover:bg-amber-500/10 transition-colors">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                    <span className="font-bold">Зураг сонгох</span>
                                                    <span className="text-[10px] uppercase tracking-widest opacity-60">Үндсэн зураг заавал байх шаардлагатай</span>
                                                </button>
                                            )}
                                        </CldUploadWidget>
                                    )}
                                </div>
                            </div>

                            {/* Additional Images */}
                            <div className="pt-8 border-t border-slate-800">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Нэмэлт зургууд (хүртэл 8)
                                </label>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                    {(formData.images || []).map((img: string, i: number) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    images: (prev.images || []).filter((_: string, idx: number) => idx !== i)
                                                }))}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all text-xs"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {(formData.images || []).length < 8 && (
                                    <CldUploadWidget
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                                        onSuccess={(result: any) => {
                                            const url = result?.info?.secure_url;
                                            if (url) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    images: [...(prev.images || []), url]
                                                }));
                                            }
                                        }}
                                    >
                                        {({ open }) => (
                                            <button
                                                type="button"
                                                onClick={() => open()}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-sm font-bold border-dashed"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Зураг нэмэх
                                            </button>
                                        )}
                                    </CldUploadWidget>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attributes Tab */}
                    {activeTab === 'attributes' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Бүтээгдэхүүний Шинж Чанар</label>
                            </div>

                            <div className="space-y-3">
                                {attributeRows.map((row, index) => (
                                    <div key={index} className="flex gap-3 items-center group animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={row.key}
                                                onChange={(e) => {
                                                    const newRows = [...attributeRows];
                                                    newRows[index].key = e.target.value;
                                                    setAttributeRows(newRows);
                                                }}
                                                placeholder="Шинж (жнэ: Өнгө)"
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all text-sm font-medium"
                                            />
                                            <input
                                                type="text"
                                                value={row.value}
                                                onChange={(e) => {
                                                    const newRows = [...attributeRows];
                                                    newRows[index].value = e.target.value;
                                                    setAttributeRows(newRows);
                                                }}
                                                placeholder="Утга (жнэ: Улаан)"
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAttributeRows(rows => rows.filter((_, i) => i !== index))}
                                            className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {attributeRows.length === 0 && (
                                    <div className="py-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                                        <p className="text-sm text-slate-500">Шинж чанар нэмэгдээгүй байна</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setAttributeRows([...attributeRows, { key: '', value: '' }])}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition-all text-sm font-bold border border-slate-700/50"
                                >
                                    <Plus className="w-4 h-4" />
                                    Шинж нэмэх
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
                                <div className={showDiscountFields ? 'md:col-span-1' : 'md:col-span-2'}>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Үндсэн Үнэ (₮) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-bold text-lg"
                                            placeholder="0"
                                            readOnly={showDiscountFields}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₮</span>
                                    </div>
                                    {showDiscountFields && <p className="text-[10px] text-amber-500 mt-1">Хямдралын дараах үнэ автоматаар бодогдож байна</p>}
                                </div>

                                {showDiscountFields && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-amber-500/80">Хуучин Үнэ (₮)</label>
                                            <input
                                                type="number"
                                                value={formData.originalPrice}
                                                onChange={(e) => handleChange('originalPrice', e.target.value)}
                                                className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-amber-500/80">Хямдралын Хувь (%)</label>
                                            <input
                                                type="number"
                                                value={formData.discountPercent}
                                                onChange={(e) => handleChange('discountPercent', e.target.value)}
                                                className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                placeholder="10"
                                                max="99"
                                                min="1"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Агуулахын Үлдэгдэл</label>
                                    <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('inventory', Math.max(0, parseInt(formData.inventory) - 1).toString())}
                                            className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                                        >-</button>
                                        <input
                                            type="number"
                                            value={formData.inventory}
                                            onChange={(e) => handleChange('inventory', e.target.value)}
                                            className="flex-1 bg-transparent border-0 text-center text-2xl font-black text-white focus:outline-none focus:ring-0 p-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleChange('inventory', (parseInt(formData.inventory || '0') + 1).toString())}
                                            className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                                        >+</button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Одоогийн үлдэгдэл: <strong className={parseInt(formData.inventory) > 0 ? 'text-emerald-500' : 'text-red-500'}>{formData.inventory} ширхэг</strong></p>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* Sidebar Settings Area */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                {/* Status & Visibility Component */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Box className="w-4 h-4 text-emerald-500" /> Төлөв
                        </h3>
                        <select
                            value={formData.stockStatus}
                            onChange={(e) => handleChange('stockStatus', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none font-medium"
                        >
                            <option value="in-stock">Бэлэн байгаа</option>
                            <option value="pre-order">Урьдчилсан захиалга</option>
                            <option value="out-of-stock">Дууссан</option>
                        </select>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-amber-500" /> Онцгой Бараа
                        </h3>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Нүүр хуудсанд харуулах</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={formData.featured}
                                    onChange={(e) => handleChange('featured', e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.featured ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featured ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Organization Component */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-4">Ангилал <span className="text-red-500">*</span></h3>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500/50 appearance-none text-sm transition-colors"
                        >
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <h3 className="text-sm font-bold text-white mb-4">Харагдах Хэсгүүд</h3>
                        <div className="flex flex-wrap gap-2">
                            {SECTIONS.map((section) => {
                                const isSelected = formData.sections.includes(section.id);
                                return (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => toggleSection(section.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSelected
                                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        {section.label}
                                        {isSelected && <CheckCircle2 className="w-3 h-3 inline-block ml-1 mb-0.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Submit Floating Action Bar for Mobile & Fixed button for Desktop */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 lg:static lg:bg-transparent lg:border-t-0 lg:p-0 lg:backdrop-blur-none z-40">
                    <div className="max-w-7xl mx-auto flex gap-4 auto-cols-auto">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-4 lg:py-3 rounded-xl text-slate-300 font-bold border border-slate-800 hover:bg-slate-800 flex-1 lg:flex-none"
                        >
                            Болих
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-4 lg:py-3 bg-amber-500 text-slate-950 rounded-xl font-black hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {initialData ? 'Шинэчлэх' : 'Хадгалах'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
