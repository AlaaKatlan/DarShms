export interface Book {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    price: number;
    discount_price?: number | null;
    cover_url?: string;
    cover_image?: string;
    isbn?: string;
  publication_year?: number;
    preview_pages?: string[];
    age_group?: string;
    category?: string;
    stock: number;
    is_featured?: boolean;
    is_active?: boolean;
    author_id?: string;
    published_year?: number;
    created_at?: string;
    updated_at?: string;
    author?: Author;
}

export interface Author {
    id: string;
    name: string;
    slug?: string;
    bio?: string;
    biography?: string;
    photo_url?: string;
    image_url?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}
