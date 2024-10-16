import View from "@/components/View";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const billing = () => {
    return <View className="max-w-3xl mx-auto py-8">
        <Card>
            <CardHeader>
                <CardTitle>Help</CardTitle>
                <CardDescription>Get help with Elytra.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Contact Max Koon</AlertTitle>
                  <AlertDescription>
                    Just give me a text at 203-500-0910 for your question.
                  </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    </View>
}

export default billing;
