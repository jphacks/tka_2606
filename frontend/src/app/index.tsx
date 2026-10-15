import { Button, Text } from "expo-router/build/react-navigation";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox } from "expo-checkbox";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const BASE_URL = "http://localhost:3000/api/todos";

export default function HomeScreen() {
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawRes = await fetch(BASE_URL);
        const todos = await rawRes.json();
        setTodos(todos);
      } catch {
        setError("通信に失敗しました");
      }
    };
    fetchData();
  });

  const handleAdd = async () => {
    const rawRes = await fetch(BASE_URL, {
      method: "POST",
      body: JSON.stringify({ title: title }),
    });
    const res = await rawRes.json();
    if (res.error) {
      setError(res.error);
      return;
    } else {
      const newTodo: Todo = res;
      const newTodos: Todo[] = [...todos, newTodo];
      setTodos(newTodos);
      setTitle("");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const rawRes = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });
      const res = await rawRes.json();
      if (res.error) {
        setError(res.error);
      } else {
        const newTodos = todos.filter((todo) => todo.id !== id);
        setTodos(newTodos);
      }
    } catch {
      setError("通信に失敗しました");
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const rawRes = await fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completed }),
      });
      const res = await rawRes.json();
      if (res.error) {
        setError(res.error);
      } else {
        const newTodos = todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          completed: todo.id === id ? !completed : completed,
          createdAt: todo.createdAt,
        }));
      }
    } catch {
      setError("通信に失敗しました");
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <Text>TODOアプリ</Text>
        <View>
          <TextInput
            onChangeText={(value) => setTitle(value)}
            value={title}
            placeholder="タイトルを入力"
          />
          <Button onPress={handleAdd}>追加</Button>
        </View>
        {error ? <Text>{error}</Text> : null}
        <View>
          {todos.map((todo) => {
            return (
              <View key={todo.id}>
                <Text>{todo.title}</Text>
                <Checkbox
                  value={todo.completed}
                  onValueChange={() => handleToggle(todo.id, todo.completed)}
                  color={todo.completed ? "#4630EB" : undefined}
                />
                <Button onPress={() => handleDelete(todo.id)}>削除</Button>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
