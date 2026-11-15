import type Database from 'better-sqlite3'
import type { Migration } from './index'

interface SeedProduct {
  code: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock: number
  unit: string
  imageUrl: string
  description: string
}

const SEED_CATEGORIES = [
  { name: 'Bebidas y Refrescos', description: 'Gaseosas, jugos, aguas minerales y cervezas' },
  { name: 'Lácteos y Huevos', description: 'Leche, quesos, cremas, mantequilla y huevos frescos' },
  { name: 'Abarrotes y Despensa', description: 'Arroz, frijol, aceites, pastas, enlatados y condimentos' },
  { name: 'Snacks y Golosinas', description: 'Papas, frituras, galletas y chocolates' },
  { name: 'Panadería y Dulces', description: 'Pan de caja, pan dulce, donas y tostadas' },
  { name: 'Limpieza del Hogar', description: 'Detergentes, suavizantes, cloro y papel higiénico' },
  { name: 'Cuidado Personal', description: 'Jabón corporal, shampoo, pasta dental y desodorantes' },
  { name: 'Frutas y Verduras', description: 'Frutas frescas y hortalizas por kilogramo' }
]

const SEED_PRODUCTS: SeedProduct[] = [
  // 1. Bebidas y Refrescos (7)
  {
    code: '7501055300075',
    name: 'Coca-Cola Original 600ml Desechable',
    category: 'Bebidas y Refrescos',
    costPrice: 16.5,
    salePrice: 22.0,
    stock: 48,
    minStock: 12,
    maxStock: 120,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80',
    description: 'Refresco clásico sabor cola en botella PET desechable'
  },
  {
    code: '7501055302840',
    name: 'Coca-Cola Sin Azúcar 600ml',
    category: 'Bebidas y Refrescos',
    costPrice: 16.5,
    salePrice: 22.0,
    stock: 36,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&q=80',
    description: 'Bebida carbonatada sin calorías ni azúcar añadida'
  },
  {
    code: '7501031311309',
    name: 'Pepsi Cola 600ml',
    category: 'Bebidas y Refrescos',
    costPrice: 15.0,
    salePrice: 20.0,
    stock: 30,
    minStock: 8,
    maxStock: 70,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80',
    description: 'Refresco refrescante sabor cola'
  },
  {
    code: '7501071110030',
    name: 'Agua Mineral Peñafiel 600ml',
    category: 'Bebidas y Refrescos',
    costPrice: 12.0,
    salePrice: 18.0,
    stock: 40,
    minStock: 10,
    maxStock: 90,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&q=80',
    description: 'Agua mineral de manantial con gas'
  },
  {
    code: '7501020510101',
    name: 'Agua Purificada Bonafont 1L',
    category: 'Bebidas y Refrescos',
    costPrice: 11.0,
    salePrice: 16.5,
    stock: 55,
    minStock: 15,
    maxStock: 120,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300&q=80',
    description: 'Agua ligera 100% purificada'
  },
  {
    code: '7501055310241',
    name: 'Jugo Del Valle Naranja 413ml',
    category: 'Bebidas y Refrescos',
    costPrice: 13.5,
    salePrice: 19.5,
    stock: 25,
    minStock: 8,
    maxStock: 60,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80',
    description: 'Néctar de jugo con pulpa de naranja natural'
  },
  {
    code: '7501064191244',
    name: 'Cerveza Corona Extra 355ml Botella',
    category: 'Bebidas y Refrescos',
    costPrice: 18.5,
    salePrice: 26.0,
    stock: 60,
    minStock: 20,
    maxStock: 150,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1608270191763-71a2a4b3f886?w=300&q=80',
    description: 'Cerveza clara tipo pilsner mexicana 4.5% alc.'
  },

  // 2. Lácteos y Huevos (7)
  {
    code: '7501020512341',
    name: 'Leche Entera Alpura Clásica 1L',
    category: 'Lácteos y Huevos',
    costPrice: 20.0,
    salePrice: 27.5,
    stock: 42,
    minStock: 12,
    maxStock: 96,
    unit: 'Litro (lt)',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
    description: 'Leche entera pasteurizada adicionada con vitaminas A y D'
  },
  {
    code: '7501020512358',
    name: 'Leche Deslactosada Lala 1L',
    category: 'Lácteos y Huevos',
    costPrice: 21.5,
    salePrice: 29.0,
    stock: 38,
    minStock: 10,
    maxStock: 90,
    unit: 'Litro (lt)',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80',
    description: 'Leche de fácil digestión ultra pasteurizada'
  },
  {
    code: '7501040001017',
    name: 'Queso Panela Fud 400g',
    category: 'Lácteos y Huevos',
    costPrice: 46.0,
    salePrice: 63.0,
    stock: 18,
    minStock: 5,
    maxStock: 40,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80',
    description: 'Queso fresco panela reducido en grasa'
  },
  {
    code: '7501020543217',
    name: 'Yogur Griego Oikos Fresa 150g',
    category: 'Lácteos y Huevos',
    costPrice: 14.0,
    salePrice: 21.0,
    stock: 24,
    minStock: 6,
    maxStock: 50,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
    description: 'Yogurt espeso estilo griego con fresa natural'
  },
  {
    code: '7501020512396',
    name: 'Crema Alpura Clásica 450ml',
    category: 'Lácteos y Huevos',
    costPrice: 24.0,
    salePrice: 33.5,
    stock: 20,
    minStock: 5,
    maxStock: 45,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80',
    description: 'Crema ácida de leche pasteurizada'
  },
  {
    code: '7501008012019',
    name: 'Mantequilla Gloria con Sal 90g',
    category: 'Lácteos y Huevos',
    costPrice: 15.5,
    salePrice: 22.5,
    stock: 30,
    minStock: 8,
    maxStock: 60,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1589985270748-03820cb058e4?w=300&q=80',
    description: 'Mantequilla pura de vaca para cocinar o untar'
  },
  {
    code: '7502220190013',
    name: 'Huevo Blanco San Juan 12 Piezas',
    category: 'Lácteos y Huevos',
    costPrice: 34.0,
    salePrice: 45.0,
    stock: 35,
    minStock: 10,
    maxStock: 80,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80',
    description: 'Cartera de huevo blanco fresco seleccionado'
  },

  // 3. Abarrotes y Despensa (10)
  {
    code: '7501018310012',
    name: 'Arroz Grano Largo Valle Verde 1kg',
    category: 'Abarrotes y Despensa',
    costPrice: 19.5,
    salePrice: 28.0,
    stock: 50,
    minStock: 15,
    maxStock: 100,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80',
    description: 'Arroz súper extra blanco de primera calidad'
  },
  {
    code: '7501018310029',
    name: 'Frijol Negro La Sierra 1kg',
    category: 'Abarrotes y Despensa',
    costPrice: 29.0,
    salePrice: 40.0,
    stock: 45,
    minStock: 12,
    maxStock: 90,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80',
    description: 'Frijol negro seleccionado grano limpio'
  },
  {
    code: '7501039120101',
    name: 'Aceite Vegetal Nutrioli Puro de Soya 850ml',
    category: 'Abarrotes y Despensa',
    costPrice: 38.0,
    salePrice: 52.0,
    stock: 40,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80',
    description: 'Aceite comestible puro de soya rico en omegas'
  },
  {
    code: '7501045401010',
    name: 'Atún Dolores en Agua 140g',
    category: 'Abarrotes y Despensa',
    costPrice: 16.5,
    salePrice: 24.0,
    stock: 65,
    minStock: 15,
    maxStock: 130,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&q=80',
    description: 'Lomo de atún aleta amarilla en agua'
  },
  {
    code: '7501005110015',
    name: 'Pasta Espagueti La Moderna 200g',
    category: 'Abarrotes y Despensa',
    costPrice: 7.5,
    salePrice: 12.0,
    stock: 80,
    minStock: 20,
    maxStock: 160,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3adc6140da1?w=300&q=80',
    description: 'Pasta de sémola de trigo fortificada'
  },
  {
    code: '7501005110022',
    name: 'Pasta Codo La Moderna 200g',
    category: 'Abarrotes y Despensa',
    costPrice: 7.5,
    salePrice: 12.0,
    stock: 75,
    minStock: 20,
    maxStock: 150,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=300&q=80',
    description: 'Pasta de sémola para sopa de codito'
  },
  {
    code: '7501003112028',
    name: 'Mayonesa McCormick con Limón 390g',
    category: 'Abarrotes y Despensa',
    costPrice: 36.0,
    salePrice: 48.5,
    stock: 30,
    minStock: 8,
    maxStock: 60,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80',
    description: 'Mayonesa clásica con toque de jugo de limón'
  },
  {
    code: '7501043100113',
    name: 'Salsa Cátsup Heinz 397g',
    category: 'Abarrotes y Despensa',
    costPrice: 20.0,
    salePrice: 28.0,
    stock: 35,
    minStock: 10,
    maxStock: 70,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
    description: 'Salsa de tomate tipo cátsup botella squeeze'
  },
  {
    code: '7501058611017',
    name: 'Café Soluble Nescafé Clásico 120g',
    category: 'Abarrotes y Despensa',
    costPrice: 63.0,
    salePrice: 86.0,
    stock: 25,
    minStock: 6,
    maxStock: 50,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80',
    description: 'Café 100% puro soluble sabor clásico'
  },
  {
    code: '7501000100012',
    name: 'Azúcar Estándar Morena 1kg',
    category: 'Abarrotes y Despensa',
    costPrice: 24.5,
    salePrice: 34.0,
    stock: 55,
    minStock: 15,
    maxStock: 110,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300&q=80',
    description: 'Azúcar de caña morena natural para endulzar'
  },

  // 4. Snacks y Golosinas (7)
  {
    code: '7501011122334',
    name: 'Papas Sabritas Sal 45g',
    category: 'Snacks y Golosinas',
    costPrice: 14.5,
    salePrice: 21.0,
    stock: 60,
    minStock: 15,
    maxStock: 120,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    description: 'Papas fritas con sal de grano clásica'
  },
  {
    code: '7501011122341',
    name: 'Doritos Nacho Sabritas 58g',
    category: 'Snacks y Golosinas',
    costPrice: 15.0,
    salePrice: 22.0,
    stock: 50,
    minStock: 12,
    maxStock: 100,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    description: 'Totopos de maíz nixtamalizado sabor queso nacho'
  },
  {
    code: '7501011122358',
    name: 'Ruffles Queso Sabritas 50g',
    category: 'Snacks y Golosinas',
    costPrice: 15.0,
    salePrice: 22.0,
    stock: 45,
    minStock: 10,
    maxStock: 90,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    description: 'Papas onduladas sabor queso'
  },
  {
    code: '7501000620015',
    name: 'Galletas Chokis Gamesa 76g',
    category: 'Snacks y Golosinas',
    costPrice: 13.5,
    salePrice: 19.5,
    stock: 40,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
    description: 'Galletas crujientes con chispas de chocolate'
  },
  {
    code: '7501000620022',
    name: 'Galletas Marías Gamesa Rollo 170g',
    category: 'Snacks y Golosinas',
    costPrice: 12.0,
    salePrice: 18.0,
    stock: 50,
    minStock: 15,
    maxStock: 100,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80',
    description: 'Galletas clásicas enriquecidas con hierro y ácido fólico'
  },
  {
    code: '7501008010015',
    name: 'Barra de Chocolate Snickers 48g',
    category: 'Snacks y Golosinas',
    costPrice: 17.5,
    salePrice: 25.0,
    stock: 35,
    minStock: 8,
    maxStock: 70,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80',
    description: 'Chocolate con leche, turrón, caramelo y cacahuates'
  },
  {
    code: '7501030401018',
    name: 'Cacahuates Japoneses Nishikawa 100g',
    category: 'Snacks y Golosinas',
    costPrice: 11.0,
    salePrice: 17.0,
    stock: 40,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&q=80',
    description: 'Cacahuate tostado con cubierta crujiente de soya'
  },

  // 5. Panadería y Dulces (5)
  {
    code: '7501000111209',
    name: 'Pan Blanco Bimbo Grande 680g',
    category: 'Panadería y Dulces',
    costPrice: 37.0,
    salePrice: 50.0,
    stock: 28,
    minStock: 8,
    maxStock: 50,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
    description: 'Pan de caja tradicional con leche'
  },
  {
    code: '7501000111216',
    name: 'Pan Integral Bimbo Grande 680g',
    category: 'Panadería y Dulces',
    costPrice: 39.0,
    salePrice: 53.0,
    stock: 22,
    minStock: 6,
    maxStock: 45,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&q=80',
    description: 'Pan elaborado con grano entero y salvado de trigo'
  },
  {
    code: '7501000111223',
    name: 'Medias Noches Bimbo 8 Piezas',
    category: 'Panadería y Dulces',
    costPrice: 33.0,
    salePrice: 44.5,
    stock: 25,
    minStock: 6,
    maxStock: 50,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=300&q=80',
    description: 'Pan especial para hot dogs esponjoso y suave'
  },
  {
    code: '7501000111230',
    name: 'Donas Bimbo Espolvoreadas 105g',
    category: 'Panadería y Dulces',
    costPrice: 17.0,
    salePrice: 24.0,
    stock: 30,
    minStock: 8,
    maxStock: 60,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80',
    description: 'Donas suaves cubiertas de azúcar glass'
  },
  {
    code: '7501000111247',
    name: 'Pan Tostado Clásico Bimbo 210g',
    category: 'Panadería y Dulces',
    costPrice: 25.0,
    salePrice: 34.5,
    stock: 20,
    minStock: 5,
    maxStock: 40,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80',
    description: 'Rebanadas crujientes tostadas al punto'
  },

  // 6. Limpieza del Hogar (7)
  {
    code: '7501006543210',
    name: 'Detergente Ariel Doble Poder 1kg',
    category: 'Limpieza del Hogar',
    costPrice: 35.0,
    salePrice: 49.5,
    stock: 35,
    minStock: 10,
    maxStock: 70,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    description: 'Detergente en polvo para ropa blanca y de color'
  },
  {
    code: '7501006543227',
    name: 'Suavizante Suavitel Fresca Primavera 850ml',
    category: 'Limpieza del Hogar',
    costPrice: 22.5,
    salePrice: 32.0,
    stock: 30,
    minStock: 8,
    maxStock: 60,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    description: 'Acondicionador de telas con fragancia duradera'
  },
  {
    code: '7501035911018',
    name: 'Limpiador Líquido Fabuloso Lavanda 1L',
    category: 'Limpieza del Hogar',
    costPrice: 19.5,
    salePrice: 28.0,
    stock: 40,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    description: 'Limpiador multiusos con aroma floral a lavanda'
  },
  {
    code: '7501025401011',
    name: 'Cloro Cloralex El Rendidor 950ml',
    category: 'Limpieza del Hogar',
    costPrice: 13.0,
    salePrice: 18.5,
    stock: 50,
    minStock: 15,
    maxStock: 100,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    description: 'Desinfectante blanqueador con fórmula concentrada'
  },
  {
    code: '7501006543234',
    name: 'Lavatrastes Líquido Salvo Limón 750ml',
    category: 'Limpieza del Hogar',
    costPrice: 29.0,
    salePrice: 40.0,
    stock: 25,
    minStock: 8,
    maxStock: 50,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80',
    description: 'Destructor de grasa difícil con aroma a limón'
  },
  {
    code: '7501017300010',
    name: 'Papel Higiénico Pétalo Rendimax 4 Rollos',
    category: 'Limpieza del Hogar',
    costPrice: 23.0,
    salePrice: 33.0,
    stock: 45,
    minStock: 12,
    maxStock: 90,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300&q=80',
    description: 'Papel higiénico hojas dobles con grabado suave'
  },
  {
    code: '7501017300027',
    name: 'Servilletas Pétalo 250 Piezas',
    category: 'Limpieza del Hogar',
    costPrice: 18.5,
    salePrice: 26.5,
    stock: 35,
    minStock: 10,
    maxStock: 70,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300&q=80',
    description: 'Servilletas blancas absorbentes para mesa'
  },

  // 7. Cuidado Personal (5)
  {
    code: '7501035912015',
    name: 'Jabón de Tocador Palmolive Oliva 150g',
    category: 'Cuidado Personal',
    costPrice: 12.5,
    salePrice: 18.0,
    stock: 60,
    minStock: 15,
    maxStock: 120,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1607006314605-e32512a865f3?w=300&q=80',
    description: 'Jabón con extracto natural de oliva y aloe'
  },
  {
    code: '7501006544019',
    name: 'Shampoo Pantene Restauración 400ml',
    category: 'Cuidado Personal',
    costPrice: 53.0,
    salePrice: 73.0,
    stock: 20,
    minStock: 6,
    maxStock: 40,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&q=80',
    description: 'Shampoo con Pro-Vitaminas para cabello dañado'
  },
  {
    code: '7501035913012',
    name: 'Pasta Dental Colgate Triple Acción 100ml',
    category: 'Cuidado Personal',
    costPrice: 19.0,
    salePrice: 27.0,
    stock: 40,
    minStock: 10,
    maxStock: 80,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e105e4b6c374?w=300&q=80',
    description: 'Protección anticaries, blancura y aliento fresco'
  },
  {
    code: '7501006545016',
    name: 'Desodorante Rexona Men Aerosol 150ml',
    category: 'Cuidado Personal',
    costPrice: 45.0,
    salePrice: 63.5,
    stock: 22,
    minStock: 6,
    maxStock: 45,
    unit: 'Pieza (pza)',
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=300&q=80',
    description: 'Antitranspirante 72 horas de protección activa'
  },
  {
    code: '7501006546013',
    name: 'Rastrillos Desechables Prestobarba 2 Piezas',
    category: 'Cuidado Personal',
    costPrice: 27.0,
    salePrice: 38.0,
    stock: 30,
    minStock: 8,
    maxStock: 60,
    unit: 'Paquete (paq)',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80',
    description: 'Máquina de afeitar con dos hojas y banda lubricante'
  },

  // 8. Frutas y Verduras (4)
  {
    code: '2000000000015',
    name: 'Manzana Red Delicious Seleccionada',
    category: 'Frutas y Verduras',
    costPrice: 32.0,
    salePrice: 46.0,
    stock: 25.5,
    minStock: 8,
    maxStock: 60,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80',
    description: 'Manzana roja crujiente y dulce por kilo'
  },
  {
    code: '2000000000022',
    name: 'Plátano Tabasco Maduro',
    category: 'Frutas y Verduras',
    costPrice: 15.0,
    salePrice: 24.5,
    stock: 35.0,
    minStock: 10,
    maxStock: 80,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80',
    description: 'Plátano chiapaneco dulce por kilo'
  },
  {
    code: '2000000000039',
    name: 'Jitomate Saladette Rojo',
    category: 'Frutas y Verduras',
    costPrice: 21.0,
    salePrice: 32.0,
    stock: 30.0,
    minStock: 10,
    maxStock: 70,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=300&q=80',
    description: 'Jitomate fresco tipo saladette por kilo'
  },
  {
    code: '2000000000046',
    name: 'Aguacate Hass Extra',
    category: 'Frutas y Verduras',
    costPrice: 48.0,
    salePrice: 69.0,
    stock: 18.0,
    minStock: 5,
    maxStock: 40,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80',
    description: 'Aguacate Hass cremoso seleccionado por kilo'
  },
  {
    code: '2000000000053',
    name: 'Limón con Semilla Colima',
    category: 'Frutas y Verduras',
    costPrice: 24.0,
    salePrice: 36.0,
    stock: 22.0,
    minStock: 6,
    maxStock: 50,
    unit: 'Kilogramo (kg)',
    imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=300&q=80',
    description: 'Limón jugoso de primera calidad por kilo'
  }
]

export const migration006SeedProducts: Migration = {
  version: 6,
  name: 'seed_50_products',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    // 1. Sembrar categorías primero
    const insertCat = db.prepare(
      `INSERT OR IGNORE INTO categories (id, name, description, active, deleted, created_at, updated_at)
       VALUES (?, ?, ?, 1, 0, ?, ?)`
    )

    for (let i = 0; i < SEED_CATEGORIES.length; i++) {
      const cat = SEED_CATEGORIES[i]
      insertCat.run(`cat-seed-${i + 1}`, cat.name, cat.description, now, now)
    }

    // 2. Sembrar los 50 productos si no existen
    const insertProduct = db.prepare(
      `INSERT OR IGNORE INTO products (
        id, code, name, category, cost_price, sale_price, stock, min_stock, max_stock,
        unit, has_tax, active, deleted, description, image_url, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, 1, 1, 0, ?, ?, ?, ?
      )`
    )

    for (let i = 0; i < SEED_PRODUCTS.length; i++) {
      const p = SEED_PRODUCTS[i]
      insertProduct.run(
        `prod-seed-${i + 1}`,
        p.code,
        p.name,
        p.category,
        p.costPrice,
        p.salePrice,
        p.stock,
        p.minStock,
        p.maxStock,
        p.unit,
        p.description,
        p.imageUrl,
        now,
        now
      )
    }
  }
}
