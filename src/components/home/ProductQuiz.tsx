import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'skin_type',
    question: 'Qual é o seu tipo de pele?',
    options: [
      { value: 'oily', label: 'Oleosa' },
      { value: 'dry', label: 'Seca' },
      { value: 'combination', label: 'Mista' },
      { value: 'normal', label: 'Normal' },
    ],
  },
  {
    id: 'main_concern',
    question: 'Qual é a sua principal preocupação?',
    options: [
      { value: 'hydration', label: 'Hidratação' },
      { value: 'anti_aging', label: 'Anti-idade' },
      { value: 'acne', label: 'Acne/Manchas' },
      { value: 'radiance', label: 'Luminosidade' },
    ],
  },
  {
    id: 'product_preference',
    question: 'Que tipo de produto você mais procura?',
    options: [
      { value: 'skincare', label: 'Cuidados com a pele' },
      { value: 'makeup', label: 'Maquiagem' },
      { value: 'haircare', label: 'Cuidados com os cabelos' },
      { value: 'fragrance', label: 'Fragrâncias' },
    ],
  },
  {
    id: 'budget',
    question: 'Qual é o seu orçamento preferido?',
    options: [
      { value: 'budget', label: 'Até R$ 50' },
      { value: 'mid', label: 'R$ 50 - R$ 100' },
      { value: 'premium', label: 'Acima de R$ 100' },
    ],
  },
];

export function ProductQuiz() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [quizQuestions[currentQuestion].id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    setIsLoading(true);
    
    // Track quiz completion
    await supabase.from('analytics_events').insert({
      event_type: 'quiz_completed',
      event_data: {
        answers,
        timestamp: new Date().toISOString(),
      },
    });

    // Get budget range
    let minPrice = 0;
    let maxPrice = 1000;
    if (answers.budget === 'budget') {
      maxPrice = 50;
    } else if (answers.budget === 'mid') {
      minPrice = 50;
      maxPrice = 100;
    } else if (answers.budget === 'premium') {
      minPrice = 100;
    }

    // Navigate to search results with filters
    navigate(`/buscar?quiz=true&min=${minPrice}&max=${maxPrice}`);
    
    toast.success('Encontramos os produtos perfeitos para você!');
    setIsLoading(false);
    setShowQuiz(false);
    setCurrentQuestion(0);
    setAnswers({});
  };

  if (!showQuiz) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold mb-2">Não sabe o que escolher?</h3>
          <p className="text-muted-foreground mb-6">
            Responda nosso quiz rápido e descubra os produtos perfeitos para você!
          </p>
          <Button
            size="lg"
            onClick={() => setShowQuiz(true)}
            className="bg-gradient-primary hover:opacity-90"
          >
            Fazer Quiz Personalizado
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestionData = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Pergunta {currentQuestion + 1} de {quizQuestions.length}
          </p>
        </div>
        <CardTitle className="text-xl">{currentQuestionData.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={answers[currentQuestionData.id] || ''}
          onValueChange={handleAnswer}
        >
          {currentQuestionData.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="text-base cursor-pointer flex-1 py-3"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              disabled={isLoading}
            >
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestionData.id] || isLoading}
            className="flex-1"
          >
            {currentQuestion === quizQuestions.length - 1
              ? 'Ver Recomendações'
              : 'Próxima'}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setShowQuiz(false);
            setCurrentQuestion(0);
            setAnswers({});
          }}
          className="w-full"
          disabled={isLoading}
        >
          Cancelar Quiz
        </Button>
      </CardContent>
    </Card>
  );
}
