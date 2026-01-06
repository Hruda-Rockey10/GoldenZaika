"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import { foodCategories } from "@/constants/data";
import { productService } from "@/services/product.service";
import { auth } from "@/lib/firebase/client";
import { aiService } from "@/services/ai.service";

export default function AddFoodPage() {
  const router = useRouter();
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad", // Default
    stars: 4,
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    portionSize: "1 plate",
    isVeg: "true"
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // Preview
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const [generatingDesc, setGeneratingDesc] = useState(false);

  const generateDescription = async () => {
     if (!data.name) {
         toast.error("Please enter a product name first");
         return;
     }
     setGeneratingDesc(true);
     try {
         const result = await aiService.generateDescription(data.name, data.category, data.isVeg === "true");
         
         if (result.success) {
             setData(prev => ({ ...prev, description: result.description }));
             toast.success("Description generated!");
         }
     } catch (error) {
         console.error(error);
         toast.error("Failed to generate description");
     } finally {
         setGeneratingDesc(false);
     }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      let imageUrl = data.imageUrl; // Default if editing (future proof)

      if (image) {
          // Upload Image
          const formData = new FormData();
          formData.append("image", image);
          formData.append("category", data.category || "general");
          formData.append("productName", data.name); // Send product name for filename
          
          try {
             // Get Firebase ID token for authentication
             const token = await auth.currentUser?.getIdToken();
             if (!token) {
               throw new Error("Not authenticated");
             }

             const uploadRes = await fetch("/api/media/upload", {
                 method: "POST",
                 headers: {
                    "Authorization": `Bearer ${token}`
                    // Do NOT set Content-Type for FormData, browser does it with boundary
                 },
                 body: formData
             });
             
             const uploadData = await uploadRes.json();

             if (uploadData.success) {
                 imageUrl = uploadData.imageUrl;
             } else {
                 throw new Error(uploadData.message || "Upload failed");
             }
          } catch (uploadError) {
             console.error("Upload Error", uploadError);
             toast.error("Failed to upload image. Using fallback.");
             // Fallback for demo if upload fails (e.g. storage permissions)
             imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
          }
      } else if (!imageUrl) {
        toast.error("Please upload an image");
        setLoading(false);
        return;
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
        isVeg: data.isVeg === "true",
        isAvailable: true // Default
      };

      const res = await productService.addProduct(productData);

      if (res.success) {
        toast.success("Food Added Successfully");
        
        // Redirect to products page and refresh to show new product
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding food");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl text-white backdrop-blur-sm">
      <h2 className="text-3xl font-bold mb-8 font-sans">
        Add <span className="text-primary-gold">New Food</span>
      </h2>
      <form onSubmit={onSubmitHandler} className="space-y-6">
        {/* Image Upload */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition-colors cursor-pointer relative bg-black/20">
          <input
            type="file"
            onChange={onImageChange}
            required
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {imagePreview ? (
            <div className="relative w-full h-48">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <Upload size={40} className="mb-2 text-primary-gold" />
              <span>Click to upload image</span>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={onChangeHandler}
              required
              placeholder="Type here"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                Product Description
                </label>
                <button
                    type="button"
                    onClick={generateDescription}
                    disabled={generatingDesc}
                    className="flex items-center gap-1.5 text-xs bg-primary-gold/10 text-primary-gold px-2 py-1 rounded-md hover:bg-primary-gold/20 transition-colors"
                >
                    {generatingDesc ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                    <span className="font-bold">Generate with AI</span>
                </button>
            </div>
            <textarea
              name="description"
              value={data.description}
              onChange={onChangeHandler}
              required
              rows="3"
              placeholder="Write content here"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-colors"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Category
              </label>
              <select
                name="category"
                value={data.category}
                onChange={onChangeHandler}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary-gold text-white cursor-pointer"
              >
                {foodCategories.map((cat) => (
                  <option key={cat} value={cat} className="text-black">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={data.price}
                onChange={onChangeHandler}
                required
                placeholder="₹200"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Stars (0-5)
              </label>
              <input
                type="number"
                name="stars"
                value={data.stars}
                onChange={onChangeHandler}
                required
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-primary-gold mb-4">Nutrition Facts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                  <label className="block text-xs text-gray-400 mb-1">Calories (kcal)</label>
                  <input type="number" name="calories" value={data.calories} onChange={onChangeHandler} placeholder="450" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none" />
               </div>
               <div>
                  <label className="block text-xs text-gray-400 mb-1">Protein (g)</label>
                  <input type="number" name="protein" value={data.protein} onChange={onChangeHandler} placeholder="20" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none" />
               </div>
               <div>
                  <label className="block text-xs text-gray-400 mb-1">Carbs (g)</label>
                  <input type="number" name="carbs" value={data.carbs} onChange={onChangeHandler} placeholder="50" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none" />
               </div>
               <div>
                  <label className="block text-xs text-gray-400 mb-1">Fat (g)</label>
                  <input type="number" name="fat" value={data.fat} onChange={onChangeHandler} placeholder="15" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                    <label className="block text-sm text-gray-300 mb-1">Portion Size</label>
                    <input type="text" name="portionSize" value={data.portionSize} onChange={onChangeHandler} placeholder="e.g. 1 Bowl" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none" />
                 </div>
                 <div>
                    <label className="block text-sm text-gray-300 mb-1">Dietary Type</label>
                    <select name="isVeg" value={data.isVeg} onChange={onChangeHandler} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-gold outline-none cursor-pointer">
                        <option value="true" className="text-black">Vegetarian</option>
                        <option value="false" className="text-black">Non-Vegetarian</option>
                    </select>
                 </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-all uppercase tracking-wide shadow-lg"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
