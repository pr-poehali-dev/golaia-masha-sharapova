-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    read_time INTEGER NOT NULL,
    published_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    user_fingerprint VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_fingerprint)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_article_id ON ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_published_date ON articles(published_date DESC);

-- Insert sample articles
INSERT INTO articles (title, excerpt, content, author, category, read_time, image_url) VALUES
('Искусство минимализма в дизайне', 'Как меньше значит больше в современном веб-дизайне', 'Минимализм — это не просто тренд, это философия создания по-настоящему функциональных интерфейсов...', 'Анна Соколова', 'Дизайн', 8, 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800'),
('Будущее искусственного интеллекта', 'Революция ИИ меняет мир технологий', 'Искусственный интеллект перестал быть научной фантастикой и стал реальностью наших дней...', 'Дмитрий Новиков', 'Технологии', 12, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'),
('Психология цвета в брендинге', 'Влияние цветовых решений на восприятие бренда', 'Цвет — это мощный инструмент коммуникации, который работает на подсознательном уровне...', 'Мария Петрова', 'Маркетинг', 6, 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=800'),
('Креативное мышление: развитие навыка', 'Практические методы раскрытия творческого потенциала', 'Креативность — это не дар избранных, а навык, который можно развивать...', 'Игорь Васильев', 'Творчество', 10, 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800'),
('Тренды веб-разработки 2025', 'Что будет актуально в следующем году', 'Веб-разработка развивается с невероятной скоростью. Давайте разберём главные тренды...', 'Елена Кузнецова', 'Технологии', 9, 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800'),
('Сторителлинг в контент-маркетинге', 'Как истории помогают продавать', 'Люди забывают факты, но помнят истории. Именно поэтому сторителлинг так эффективен...', 'Александр Морозов', 'Маркетинг', 7, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800');