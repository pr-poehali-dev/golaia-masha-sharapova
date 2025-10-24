import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  read_time: number;
  published_date: string;
  image_url: string;
  avg_rating: number;
  rating_count: number;
}

const API_URL = 'https://functions.poehali.dev/6a40df31-a1dd-46e2-b8f5-d17ca7e08272';

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_URL}?action=articles`);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (articleId: number, rating: number) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate', article_id: articleId, rating })
      });
      const result = await response.json();
      
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, avg_rating: result.avg_rating, rating_count: result.rating_count }
          : article
      ));
      
      if (selectedArticle?.id === articleId) {
        setSelectedArticle(prev => prev ? { ...prev, avg_rating: result.avg_rating, rating_count: result.rating_count } : null);
      }
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  const StarRating = ({ articleId, currentRating, ratingCount }: { articleId: number; currentRating: number; ratingCount: number }) => {
    const [hover, setHover] = useState(0);
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(articleId, star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-125 focus:outline-none"
            >
              <Icon 
                name={star <= (hover || Math.round(currentRating)) ? "Star" : "Star"}
                size={20}
                className={star <= (hover || Math.round(currentRating)) ? "fill-accent text-accent" : "text-muted-foreground"}
              />
            </button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {currentRating > 0 ? (
            <span>{currentRating.toFixed(1)} ({ratingCount})</span>
          ) : (
            <span>Оцените первым</span>
          )}
        </div>
      </div>
    );
  };

  const ArticleCard = ({ article, delay }: { article: Article; delay: number }) => (
    <Card 
      className="group overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/30 hover:shadow-2xl transition-all duration-500 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => { setSelectedArticle(article); setActiveTab('read'); }}
    >
      <div className="aspect-video overflow-hidden relative">
        <img 
          src={article.image_url} 
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm border-0">
          {article.category}
        </Badge>
      </div>
      
      <div className="p-6 space-y-4">
        <h3 className="text-2xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        
        <p className="text-muted-foreground line-clamp-2">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Icon name="User" size={16} />
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={16} />
            <span>{article.read_time} мин</span>
          </div>
        </div>
        
        <StarRating 
          articleId={article.id} 
          currentRating={article.avg_rating} 
          ratingCount={article.rating_count}
        />
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-2xl text-primary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">
              Креативный Блог
            </h1>
            <nav className="flex gap-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="home" className="data-[state=active]:bg-primary">
                    <Icon name="Home" size={18} className="mr-2" />
                    Главная
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="data-[state=active]:bg-primary">
                    <Icon name="Archive" size={18} className="mr-2" />
                    Архив
                  </TabsTrigger>
                  <TabsTrigger value="about" className="data-[state=active]:bg-primary">
                    <Icon name="Info" size={18} className="mr-2" />
                    О блоге
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="home" className="space-y-12">
            <section className="space-y-4 animate-fade-in">
              <h2 className="text-3xl font-bold text-foreground">Последние статьи</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.slice(0, 6).map((article, idx) => (
                  <ArticleCard key={article.id} article={article} delay={idx * 100} />
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="archive" className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground animate-fade-in">Архив статей</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, idx) => (
                <ArticleCard key={article.id} article={article} delay={idx * 50} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="max-w-3xl mx-auto animate-fade-in">
            <Card className="p-12 border-0 bg-gradient-to-br from-card via-card to-primary/5">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  О блоге
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Добро пожаловать в наш креативный блог — пространство, где идеи обретают форму, 
                    а мысли превращаются в вдохновляющие истории.
                  </p>
                  <p>
                    Мы создаём контент о дизайне, технологиях, маркетинге и креативном мышлении. 
                    Каждая статья — это результат глубокого исследования и личного опыта наших авторов.
                  </p>
                  <p>
                    Наша миссия — делиться знаниями, которые помогают людям расти профессионально 
                    и находить нестандартные решения в повседневной работе.
                  </p>
                  <div className="pt-6 flex gap-4">
                    <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      <Icon name="Mail" size={18} className="mr-2" />
                      Связаться с нами
                    </Button>
                    <Button variant="outline">
                      <Icon name="Rss" size={18} className="mr-2" />
                      Подписаться
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="read">
            {selectedArticle && (
              <div className="max-w-4xl mx-auto animate-scale-in">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('home')}
                  className="mb-6"
                >
                  <Icon name="ArrowLeft" size={18} className="mr-2" />
                  Назад к статьям
                </Button>
                
                <article className="space-y-8">
                  <div className="aspect-video overflow-hidden rounded-2xl">
                    <img 
                      src={selectedArticle.image_url} 
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Badge className="bg-primary">{selectedArticle.category}</Badge>
                    <h1 className="text-5xl font-bold text-foreground">{selectedArticle.title}</h1>
                    
                    <div className="flex items-center gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={18} />
                        <span>{selectedArticle.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={18} />
                        <span>{selectedArticle.read_time} мин чтения</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={18} />
                        <span>{new Date(selectedArticle.published_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {selectedArticle.excerpt}
                    </p>
                    <p className="text-foreground/90 leading-relaxed">
                      {selectedArticle.content}
                    </p>
                  </div>
                  
                  <Card className="p-8 border-0 bg-muted/30">
                    <h3 className="text-2xl font-bold mb-6 text-foreground">Оцените эту статью</h3>
                    <StarRating 
                      articleId={selectedArticle.id} 
                      currentRating={selectedArticle.avg_rating} 
                      ratingCount={selectedArticle.rating_count}
                    />
                  </Card>
                </article>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border/50 mt-24">
        <div className="container mx-auto px-6 py-12 text-center text-muted-foreground">
          <p className="text-lg">Креативный Блог © 2025</p>
          <p className="text-sm mt-2">Делимся идеями, которые вдохновляют</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
