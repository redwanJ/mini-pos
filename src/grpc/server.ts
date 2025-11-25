import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import prisma from '../lib/db';

const PROTO_PATH = path.join(__dirname, 'proto/pos.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const minipos = protoDescriptor.minipos;

// Helper to convert Date to Timestamp
function toTimestamp(date: Date) {
  return {
    seconds: Math.floor(date.getTime() / 1000).toString(),
    nanos: (date.getTime() % 1000) * 1000000,
  };
}

// Product Service Implementation
const productService = {
  async getProduct(call: any, callback: any) {
    try {
      const { id, businessId } = call.request;
      const product = await prisma.product.findFirst({
        where: { id, businessId },
        include: { category: true },
      });

      if (!product) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Product not found',
        });
      }

      callback(null, {
        id: product.id,
        businessId: product.businessId,
        name: product.name,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        qrCode: product.qrCode,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        categoryName: product.category?.name,
        createdAt: toTimestamp(product.createdAt),
        updatedAt: toTimestamp(product.updatedAt),
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  async listProducts(call: any, callback: any) {
    try {
      const { businessId, search, categoryId, limit = 50, offset = 0 } = call.request;

      const where: any = { businessId };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { qrCode: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true },
          take: limit,
          skip: offset,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      callback(null, {
        products: products.map((p) => ({
          id: p.id,
          businessId: p.businessId,
          name: p.name,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          stock: p.stock,
          lowStockThreshold: p.lowStockThreshold,
          qrCode: p.qrCode,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
          categoryName: p.category?.name,
          createdAt: toTimestamp(p.createdAt),
          updatedAt: toTimestamp(p.updatedAt),
        })),
        total,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  async createProduct(call: any, callback: any) {
    try {
      const {
        businessId,
        name,
        costPrice,
        salePrice,
        stock,
        lowStockThreshold,
        categoryId,
        imageUrl,
      } = call.request;

      const product = await prisma.product.create({
        data: {
          businessId,
          name,
          costPrice,
          salePrice,
          stock,
          lowStockThreshold,
          categoryId,
          imageUrl,
        },
        include: { category: true },
      });

      callback(null, {
        id: product.id,
        businessId: product.businessId,
        name: product.name,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        qrCode: product.qrCode,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        categoryName: product.category?.name,
        createdAt: toTimestamp(product.createdAt),
        updatedAt: toTimestamp(product.updatedAt),
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  async deductStock(call: any, callback: any) {
    try {
      const { productId, businessId, quantity } = call.request;

      const product = await prisma.product.findFirst({
        where: { id: productId, businessId },
      });

      if (!product) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Product not found',
        });
      }

      if (product.stock < quantity) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: 'Insufficient stock',
        });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { stock: product.stock - quantity },
      });

      callback(null, {
        success: true,
        newStock: updated.stock,
        product: {
          id: updated.id,
          name: updated.name,
          stock: updated.stock,
        },
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  async getProductByQR(call: any, callback: any) {
    try {
      const { qrCode, businessId } = call.request;

      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { qrCode, businessId },
            { id: qrCode, businessId },
          ],
        },
        include: { category: true },
      });

      if (!product) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Product not found',
        });
      }

      callback(null, {
        id: product.id,
        businessId: product.businessId,
        name: product.name,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        qrCode: product.qrCode,
        createdAt: toTimestamp(product.createdAt),
        updatedAt: toTimestamp(product.updatedAt),
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
};

// Start gRPC Server
export function startGrpcServer(port = 50051) {
  const server = new grpc.Server();

  server.addService(minipos.ProductService.service, productService);

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        return;
      }
      console.log(`gRPC server running on port ${boundPort}`);
    }
  );

  return server;
}

// For standalone gRPC server
if (require.main === module) {
  startGrpcServer();
}
