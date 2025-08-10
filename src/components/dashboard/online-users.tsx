import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const users = [
  {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '(11) 98765-4321',
    step: 'Pagamento',
    stepVariant: 'default'
  },
  {
    name: 'Maria Oliveira',
    email: 'maria.oliveira@example.com',
    phone: '(21) 99999-8888',
    step: 'Dados Pessoais',
    stepVariant: 'secondary'
  },
  {
    name: 'Carlos Pereira',
    email: 'carlos.pereira@example.com',
    phone: '(31) 91234-5678',
    step: 'Revisão',
    stepVariant: 'outline'
  },
   {
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    phone: '(41) 95555-4444',
    step: 'Pagamento',
    stepVariant: 'default'
  },
  {
    name: 'Pedro Martins',
    email: 'pedro.martins@example.com',
    phone: '(51) 94321-8765',
    step: 'Dados Pessoais',
    stepVariant: 'secondary'
  },
]

export function OnlineUsers() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          <CardTitle>Usuários Online no Checkout</CardTitle>
        </div>
        <CardDescription>
          Acompanhe em tempo real quem está finalizando uma compra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-right">Etapa Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.email}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{user.email}</span>
                    <span className="text-xs text-muted-foreground">{user.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                   <Badge variant={user.stepVariant as any}>{user.step}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
