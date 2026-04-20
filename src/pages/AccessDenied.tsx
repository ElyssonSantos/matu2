import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <ShieldX className="h-24 w-24 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold">Acesso Negado</h1>
        <p className="text-xl text-muted-foreground">
          Você não tem permissão para acessar esta área.
        </p>
        <p className="text-muted-foreground">
          Esta seção é restrita apenas para administradores e membros da equipe autorizada.
        </p>
        <Link to="/">
          <Button size="lg">
            Voltar para a Loja
          </Button>
        </Link>
      </div>
    </div>
  );
}