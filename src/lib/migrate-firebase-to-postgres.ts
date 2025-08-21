import { db } from '@/lib/firebase';
import prisma from '@/lib/prisma';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Migra usuários do Firebase para o PostgreSQL
 */
export async function migrateUsers() {
  try {
    console.log('Iniciando migração de usuários...');
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    
    for (const doc of userSnapshot.docs) {
      const userData = doc.data();
      
      // Verificar se o usuário já existe no PostgreSQL
      const existingUser = await prisma.user.findUnique({
        where: { id: doc.id },
      });
      
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: doc.id,
            email: userData.email,
            name: userData.name || '',
          },
        });
        console.log(`Usuário ${doc.id} migrado com sucesso.`);
      } else {
        console.log(`Usuário ${doc.id} já existe no PostgreSQL.`);
      }
    }
    
    console.log('Migração de usuários concluída.');
  } catch (error) {
    console.error('Erro ao migrar usuários:', error);
    throw error;
  }
}

/**
 * Migra lojas do Firebase para o PostgreSQL
 */
export async function migrateStores() {
  try {
    console.log('Iniciando migração de lojas...');
    const storesCollection = collection(db, 'stores');
    const storeSnapshot = await getDocs(storesCollection);
    
    for (const doc of storeSnapshot.docs) {
      const storeData = doc.data();
      
      // Verificar se a loja já existe no PostgreSQL
      const existingStore = await prisma.store.findUnique({
        where: { id: doc.id },
      });
      
      if (!existingStore) {
        await prisma.store.create({
          data: {
            id: doc.id,
            name: storeData.name,
            userId: storeData.userId,
          },
        });
        console.log(`Loja ${doc.id} migrada com sucesso.`);
      } else {
        console.log(`Loja ${doc.id} já existe no PostgreSQL.`);
      }
    }
    
    console.log('Migração de lojas concluída.');
  } catch (error) {
    console.error('Erro ao migrar lojas:', error);
    throw error;
  }
}

/**
 * Migra produtos do Firebase para o PostgreSQL
 */
export async function migrateProducts() {
  try {
    console.log('Iniciando migração de produtos...');
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    
    for (const doc of productSnapshot.docs) {
      const productData = doc.data();
      
      // Verificar se o produto já existe no PostgreSQL
      const existingProduct = await prisma.product.findUnique({
        where: { id: doc.id },
      });
      
      if (!existingProduct) {
        await prisma.product.create({
          data: {
            id: doc.id,
            name: productData.name,
            description: productData.description || '',
            price: productData.price,
            storeId: productData.storeId,
          },
        });
        console.log(`Produto ${doc.id} migrado com sucesso.`);
      } else {
        console.log(`Produto ${doc.id} já existe no PostgreSQL.`);
      }
    }
    
    console.log('Migração de produtos concluída.');
  } catch (error) {
    console.error('Erro ao migrar produtos:', error);
    throw error;
  }
}

/**
 * Migra pedidos do Firebase para o PostgreSQL
 */
export async function migrateOrders() {
  try {
    console.log('Iniciando migração de pedidos...');
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection);
    
    for (const orderDoc of orderSnapshot.docs) {
      const orderData = orderDoc.data();
      
      // Verificar se o pedido já existe no PostgreSQL
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderDoc.id },
      });
      
      if (!existingOrder) {
        // Buscar itens do pedido no Firebase
        const orderItemsCollection = collection(db, `orders/${orderDoc.id}/items`);
        const orderItemsSnapshot = await getDocs(orderItemsCollection);
        
        // Criar o pedido com seus itens no PostgreSQL
        await prisma.order.create({
          data: {
            id: orderDoc.id,
            storeId: orderData.storeId,
            status: orderData.status || 'pending',
            total: orderData.total,
            items: {
              create: orderItemsSnapshot.docs.map(itemDoc => {
                const itemData = itemDoc.data();
                return {
                  id: itemDoc.id,
                  productId: itemData.productId,
                  quantity: itemData.quantity,
                  price: itemData.price,
                };
              }),
            },
          },
        });
        
        console.log(`Pedido ${orderDoc.id} migrado com sucesso.`);
      } else {
        console.log(`Pedido ${orderDoc.id} já existe no PostgreSQL.`);
      }
    }
    
    console.log('Migração de pedidos concluída.');
  } catch (error) {
    console.error('Erro ao migrar pedidos:', error);
    throw error;
  }
}

/**
 * Executa a migração completa do Firebase para o PostgreSQL
 */
export async function migrateAllData() {
  try {
    console.log('Iniciando migração completa de dados...');
    
    // Migrar na ordem correta para respeitar as relações
    await migrateUsers();
    await migrateStores();
    await migrateProducts();
    await migrateOrders();
    
    console.log('Migração completa de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração completa:', error);
    throw error;
  }
}