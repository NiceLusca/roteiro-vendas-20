import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Wand2, 
  Copy, 
  RefreshCw, 
  Send, 
  Bot, 
  Lightbulb,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

interface GeneratedContent {
  id: string;
  type: 'email' | 'whatsapp' | 'call_script';
  content: string;
  tone: string;
  objective: string;
  timestamp: Date;
}

export function IntelligentCommunicationAssistant() {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedObjective, setSelectedObjective] = useState('follow_up');
  const [selectedType, setSelectedType] = useState<'email' | 'whatsapp' | 'call_script'>('whatsapp');
  const { toast } = useToast();

  const tones = [
    { value: 'professional', label: 'Profissional' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'casual', label: 'Casual' },
    { value: 'persuasive', label: 'Persuasivo' },
    { value: 'empathetic', label: 'Empático' }
  ];

  const objectives = [
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'qualification', label: 'Qualificação' },
    { value: 'objection_handling', label: 'Tratamento de Objeções' },
    { value: 'appointment', label: 'Agendamento' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'closing', label: 'Fechamento' }
  ];

  const communicationTypes = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'call_script', label: 'Script de Ligação', icon: Phone }
  ];

  const generateContent = async () => {
    setGenerating(true);
    try {
      // Simular geração de conteúdo por IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      const templates = getTemplatesByType(selectedType, selectedTone, selectedObjective);
      const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: selectedType,
        content: customPrompt ? 
          `${selectedTemplate}\n\n[Personalização baseada em: "${customPrompt}"]` : 
          selectedTemplate,
        tone: selectedTone,
        objective: selectedObjective,
        timestamp: new Date()
      };

      setGeneratedContent(prev => [newContent, ...prev]);

      toast({
        title: "Conteúdo Gerado com IA",
        description: `${communicationTypes.find(t => t.value === selectedType)?.label} criado com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro na Geração",
        description: "Não foi possível gerar o conteúdo",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const getTemplatesByType = (type: string, tone: string, objective: string) => {
    const templates = {
      whatsapp: {
        follow_up: [
          "Oi [Nome]! 😊\n\nEspero que esteja bem! Queria fazer um acompanhamento sobre nossa conversa anterior. Tem alguma dúvida que posso esclarecer?\n\nEstou aqui para ajudar! 🚀",
          "Olá [Nome]! 👋\n\nComo está andando sua reflexão sobre nossa proposta? Se tiver qualquer pergunta, estou disponível para conversar.\n\nAbraços! ✨"
        ],
        qualification: [
          "Oi [Nome]! 😊\n\nPara personalizar melhor nossa proposta, gostaria de entender um pouco mais sobre:\n\n• Seu faturamento atual\n• Principais desafios\n• Metas para os próximos meses\n\nPodemos agendar 15min para conversar? 📞",
          "Olá [Nome]! 👋\n\nQue bom ter você no nosso pipeline! Para criar uma solução sob medida, preciso conhecer melhor seu negócio.\n\nTem 10 minutos para uma call rápida hoje? 🎯"
        ]
      },
      email: {
        follow_up: [
          "Assunto: Acompanhamento - Sua jornada de crescimento\n\nOlá [Nome],\n\nEspero que esteja bem!\n\nGostaria de fazer um acompanhamento sobre nossa conversa anterior e verificar se há alguma dúvida que posso esclarecer sobre nossa proposta.\n\nEstou à disposição para qualquer esclarecimento.\n\nAtenciosamente,\n[Seu Nome]"
        ],
        qualification: [
          "Assunto: Próximos passos - Vamos personalizar sua solução?\n\nOlá [Nome],\n\nQue prazer ter você em nosso processo!\n\nPara criar uma proposta verdadeiramente personalizada, gostaria de entender melhor:\n\n• Seu cenário atual\n• Principais desafios\n• Objetivos para os próximos meses\n\nPodemos agendar uma conversa de 15 minutos?\n\nAguardo seu retorno!\n[Seu Nome]"
        ]
      },
      call_script: {
        follow_up: [
          "Script de Ligação - Follow-up:\n\n1. Apresentação:\n\"Oi [Nome], aqui é o [Seu Nome] da [Empresa]. Como você está?\"\n\n2. Motivo da ligação:\n\"Estou ligando para fazer um acompanhamento da nossa conversa anterior sobre [tópico]. Teve tempo de pensar sobre o que conversamos?\"\n\n3. Escuta ativa:\n[Aguardar resposta e fazer perguntas de esclarecimento]\n\n4. Próximos passos:\n\"Baseado no que você me falou, sugiro que [ação]. O que acha?\""
        ],
        appointment: [
          "Script de Agendamento:\n\n1. Abertura calorosa:\n\"Oi [Nome]! Aqui é o [Seu Nome]. Como está seu dia?\"\n\n2. Propósito:\n\"Te ligo porque vi que você tem interesse em [solução]. Gostaria de agendar 20 minutos para te mostrar como podemos ajudar especificamente no seu caso.\"\n\n3. Criar urgência sutil:\n\"Tenho duas opções essa semana: [horário 1] ou [horário 2]. Qual funciona melhor?\"\n\n4. Confirmar:\n\"Perfeito! Vou te enviar o link da reunião por WhatsApp. Até lá!\""
        ]
      }
    };

    return templates[type]?.[objective] || ["Conteúdo personalizado baseado em sua solicitação."];
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência"
    });
  };

  const regenerateContent = (contentId: string) => {
    const content = generatedContent.find(c => c.id === contentId);
    if (content) {
      setSelectedType(content.type);
      setSelectedTone(content.tone);
      setSelectedObjective(content.objective);
      generateContent();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assistente de Comunicação IA</h2>
        <p className="text-muted-foreground">Gere conteúdo personalizado para WhatsApp, email e ligações</p>
      </div>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Gerador de Conteúdo
          </CardTitle>
          <CardDescription>
            Configure os parâmetros e deixe a IA criar o conteúdo perfeito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Comunicação</label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communicationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tom da Mensagem</label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Objetivo</label>
              <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectives.map((objective) => (
                    <SelectItem key={objective.value} value={objective.value}>
                      {objective.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block">Personalização (opcional)</label>
            <Textarea
              placeholder="Descreva informações específicas do lead ou contexto especial..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateContent}
            disabled={generating}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {generating ? 'Gerando com IA...' : 'Gerar Conteúdo'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conteúdo Gerado
            </CardTitle>
            <CardDescription>
              Conteúdo criado pela IA - pronto para usar ou personalizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedContent.map((content) => {
                const typeData = communicationTypes.find(t => t.value === content.type);
                return (
                  <Card key={content.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeData && <typeData.icon className="w-4 h-4 text-primary" />}
                          <span className="font-medium">{typeData?.label}</span>
                          <Badge variant="outline">
                            {tones.find(t => t.value === content.tone)?.label}
                          </Badge>
                          <Badge variant="outline">
                            {objectives.find(o => o.value === content.objective)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => regenerateContent(content.id)}
                            disabled={generating}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(content.content)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="bg-muted/50 p-3 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                          {content.content}
                        </pre>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Gerado em {content.timestamp.toLocaleTimeString()}</span>
                        <Button variant="ghost" size="sm" className="h-auto py-1 px-2">
                          <Send className="w-3 h-3 mr-1" />
                          Usar agora
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-foreground mb-2">Dicas para melhor resultado:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personalize sempre com o nome do lead e informações específicas</li>
                <li>• Use o tom adequado para o perfil do seu lead</li>
                <li>• Adapte o conteúdo gerado conforme necessário</li>
                <li>• Teste diferentes abordagens para diferentes segmentos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}