'''
Business: API для работы с блогом - получение статей и управление рейтингами
Args: event - HTTP запрос с методом GET/POST, body, queryStringParameters
      context - объект с request_id, function_name и другими атрибутами
Returns: JSON с данными статей и рейтингов
'''

import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def get_user_fingerprint(event: Dict[str, Any]) -> str:
    headers = event.get('headers', {})
    ip = headers.get('X-Forwarded-For', 'unknown')
    user_agent = headers.get('User-Agent', 'unknown')
    fingerprint_data = f"{ip}-{user_agent}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'articles')
            
            if action == 'articles':
                cur.execute('''
                    SELECT 
                        a.*,
                        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) as avg_rating,
                        COUNT(r.id) as rating_count
                    FROM articles a
                    LEFT JOIN ratings r ON a.id = r.article_id
                    GROUP BY a.id
                    ORDER BY a.published_date DESC
                ''')
                articles = cur.fetchall()
                
                result = []
                for row in articles:
                    item = dict(row)
                    item['avg_rating'] = float(item['avg_rating'])
                    result.append(item)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'article':
                article_id = params.get('id')
                if not article_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Article ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    SELECT 
                        a.*,
                        COALESCE(AVG(r.rating), 0) as avg_rating,
                        COUNT(r.id) as rating_count
                    FROM articles a
                    LEFT JOIN ratings r ON a.id = r.article_id
                    WHERE a.id = %s
                    GROUP BY a.id
                ''', (article_id,))
                article = cur.fetchone()
                
                if article:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(dict(article), default=str),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Article not found'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'rate':
                article_id = body_data.get('article_id')
                rating = body_data.get('rating')
                
                if not article_id or not rating or rating < 1 or rating > 5:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid data'}),
                        'isBase64Encoded': False
                    }
                
                user_fp = get_user_fingerprint(event)
                
                cur.execute('''
                    INSERT INTO ratings (article_id, rating, user_fingerprint)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (article_id, user_fingerprint)
                    DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
                ''', (article_id, rating, user_fp))
                conn.commit()
                
                cur.execute('''
                    SELECT 
                        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating,
                        COUNT(id) as rating_count
                    FROM ratings
                    WHERE article_id = %s
                ''', (article_id,))
                result = cur.fetchone()
                
                response_data = dict(result)
                response_data['avg_rating'] = float(response_data['avg_rating'])
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(response_data, default=str),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()