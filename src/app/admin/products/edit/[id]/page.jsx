"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { Upload, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { foodCategories } from "@/constants/data";
import { productService } from "@/services/product.service";
import { auth } from "@/lib/firebase/client";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad",
    stars: 4,
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    portionSize: "1 plate",
    isVeg: "true"
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getProductById(productId);
        if (response.success && response.product) {
          const product = response.product;
          setData({
            name: product.name || "",
            description: product.description || "",
            price: product.price?.toString() || "",
            category: product.category || "Salad",
            stars: product.stars || 4,
            calories: product.calories?.toString() || "",
            protein: product.protein?.toString() || "",
            carbs: product.carbs?.toString() || "",
            fat: product.fat?.toString() || "",
            portionSize: product.portionSize || "1 plate",
            isVeg: product.isVeg !== undefined ? product.isVeg.toString() : "true"
          });
          setExistingImageUrl(product.imageUrl || "");
          setImagePreview(product.imageUrl || null);
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setFetchingProduct(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file)); //Solution: URL.createObjectURL(file) creates a Fake, Temporary URL (like blob:http://localhost:3000/a1b2-c3d4...) that points to the file in your computer's memory.
    }
  };

  const generateDescription = async () => {
    if (!data.name) {
      toast.error("Please enter a product name first");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           name: data.name,
           category: data.category,
           isVeg: data.isVeg === "true"
        })
      });
      const result = await res.json();
      if (result.success) {
        setData(prev => ({ ...prev, description: result.description }));
        toast.success("Description generated!");
      }
    } catch (error) {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      let imageUrl = existingImageUrl; // Keep existing image by default

      // Only upload new image if one was selected
      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("category", data.category || "general");
        formData.append("productName", data.name);
        
        try {
          const token = await auth.currentUser?.getIdToken();
          if (!token) {
            throw new Error("Not authenticated");
          }

          const uploadRes = await fetch("/api/media/upload", {
              method: "POST",
              headers: {
                 "Authorization": `Bearer ${token}`
                 // Do NOT set Content-Type for FormData
              },
              body: formData
          });
          
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            imageUrl = uploadData.imageUrl;
          }
        } catch (uploadError) {
          console.error("Upload Error", uploadError);
          toast.error("Failed to upload new image. Keeping existing image.");
        }
      }

      const productData = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        stars: Number(data.stars),
        imageUrl: imageUrl,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        portionSize: data.portionSize,
        isVeg: data.isVeg === "true"
      };

      const res = await productService.updateProduct(productId, productData);

      if (res.success) {
        toast.success("Product Updated Successfully");
        
        // Redirect to products page and refresh
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="text-white" size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
      </div>

      <form onSubmit={onSubmitHandler} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <label className="block text-white font-semibold mb-3">Product Image</label>
          <div className="flex flex-col items-center gap-4">
            {imagePreview && (
              <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-primary-gold">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
            )}
            <label className="cursor-pointer px-6 py-3 bg-primary-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-all flex items-center gap-2">
              <Upload size={20} />
              {image ? "Change Image" : existingImageUrl ? "Upload New Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
            <p className="text-gray-400 text-sm">
              {existingImageUrl && !image && "Leave unchanged to keep current image"}
            </p>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-white font-semibold mb-2">Product Name *</label>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
            placeholder="e.g., Chicken Biryani"
            required
          />
        </div>

        {/* Description with AI */}
        <div>
          <label className="block text-white font-semibold mb-2">Description *</label>
          <textarea
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none resize-none"
            placeholder="Enter product description..."
            required
          />
          <button
            type="button"
            onClick={generateDescription}
            disabled={generatingDesc || !data.name}
            className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generatingDesc ? "Generating..." : "Generate with AI"}
          </button>
        </div>

        {/* Price and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-semibold mb-2">Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={data.price}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="299"
              required
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Category *</label>
            <select
              name="category"
              value={data.category}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              required
            >
              {foodCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-black">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Calories</label>
            <input
              type="number"
              name="calories"
              value={data.calories}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="450"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Protein (g)</label>
            <input
              type="number"
              name="protein"
              value={data.protein}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="25"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Carbs (g)</label>
            <input
              type="number"
              name="carbs"
              value={data.carbs}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="60"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Fat (g)</label>
            <input
              type="number"
              name="fat"
              value={data.fat}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="15"
            />
          </div>
        </div>

        {/* Portion and Diet Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-semibold mb-2">Portion Size</label>
            <input
              type="text"
              name="portionSize"
              value={data.portionSize}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
              placeholder="1 plate"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Diet Type</label>
            <select
              name="isVeg"
              value={data.isVeg}
              onChange={onChangeHandler}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-primary-gold focus:outline-none"
            >
              <option value="true" className="bg-black">Vegetarian</option>
              <option value="false" className="bg-black">Non-Vegetarian</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary-gold hover:bg-yellow-500 text-black font-bold text-lg rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Updating Product...
            </>
          ) : (
            "Update Product"
          )}
        </button>
      </form>
    </div>
  );
}
