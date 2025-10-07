import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeadDetail() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
        </CardContent>
      </Card>
    </div>
  );
}
