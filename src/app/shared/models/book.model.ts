export interface Book {
    id: string;
    title: string;
    author_id: string;
    description?: string;
    price: number;
    stock: number;
    cover_image?: string;
    category?: string;
    published_year?: number;
    created_at?: string;
    author?: Author;
}

export interface Author {
    id: string;
    name: string;
    biography?: string;
    image_url?: string;
    created_at?: string;
}
