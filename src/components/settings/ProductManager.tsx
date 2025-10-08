import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { Product } from '@/types/crm';
import { ProductForm } from '@/components/forms/ProductForm';
import { formatCurrency } from '@/utils/formatters';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useToast } from '@/hooks/use-toast';

export function ProductManager() {
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { products, loading, deleteProduct } = useSupabaseProducts();
  const { toast } = useToast();

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        // Error handling já está no hook
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const getProductTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'Mentoria':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Curso':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Plano':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Consultoria':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecurrenceColor = (recorrencia: string) => {
    switch (recorrencia) {
      case 'Mensal':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Trimestral':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Anual':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Configure os produtos disponíveis para venda
          </p>
        </div>
        
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={selectedProduct}
              onSave={() => {
                setIsProductDialogOpen(false);
                setSelectedProduct(null);
              }}
              onCancel={() => {
                setIsProductDialogOpen(false);
                setSelectedProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg">{product.nome}</h3>
                  </div>
                </div>
                <Badge variant={product.ativo ? 'default' : 'secondary'}>
                  {product.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preço:</span>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-success mr-1" />
                    <span className="font-semibold text-success">
                      {formatCurrency(product.preco)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEditProduct(product)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDeleteProduct(product.id)}
                  disabled={product.nome === 'Indefinido'} // Proteger produto padrão
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table View Alternative */}
      <Card className="mt-8">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Preço Padrão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>
                    {product.nome}
                  </TableCell>
                  <TableCell className="font-semibold text-success">
                    {formatCurrency(product.preco)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.ativo ? 'default' : 'secondary'}>
                      {product.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={product.nome === 'Indefinido'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}